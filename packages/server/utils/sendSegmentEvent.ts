import getRethink from '../database/rethinkDriver'
import countTiersForUserId from '../graphql/queries/helpers/countTiersForUserId'
import segmentIo from './segmentIo'
import {ISegmentEventTrackOptions, TierEnum} from '../../client/types/graphql'
import resolvePromiseObj from '../../client/utils/resolvePromiseObj'
import {ENTERPRISE, PERSONAL, PRO} from '../../client/utils/constants'

const PERSONAL_TIER_MAX_TEAMS = 2

interface HubspotTraits {
  id: string
  solesOpOrgCount: number
  salesOpMeetingCount: number
  isAnyBillingLeader: boolean
  highestTier: TierEnum
}

const getHubspotTraits = (userIds: string[]) => {
  const r = getRethink()
  // # of orgs the user is on where teams is >= 3
  return r(userIds).map((userId) => ({
    id: userId,
    salesOpOrgCount: r
      .table('OrganizationUser')
      .getAll(userId, {index: 'userId'})
      .filter({removedAt: null})
      .coerceTo('array')('orgId')
      .default([])
      .do((orgIds) => {
        return r
          .table('Organization')
          .getAll(r.args(orgIds), {index: 'id'})
          .merge((row) => ({
            teamCount: r
              .table('Team')
              .getAll(row('id'), {index: 'orgId'})
              .count()
          }))
          .filter((row) => row('teamCount').gt(PERSONAL_TIER_MAX_TEAMS))
          .count()
      }),
    salesOpMeetingCount: r
      .table('MeetingMember')
      .getAll(userId, {index: 'userId'})
      .count(),
    isAnyBillingLeader: r
      .table('OrganizationUser')
      .getAll(userId, {index: 'userId'})
      .filter({removedAt: null, role: 'billingLeader'})
      .count()
      .ge(1),
    highestTier: r
      .table('OrganizationUser')
      .getAll(userId, {index: 'userId'})
      .filter({removedAt: null})
      .coerceTo('array')('orgId')
      .default([])
      .do((orgIds) => {
        return r
          .table('Organization')
          .getAll(r.args(orgIds), {index: 'id'})
          .coerceTo('array')('tier')
          .distinct()
      })
      .do((tiers) => {
        return r.branch(
          tiers.contains(ENTERPRISE),
          ENTERPRISE,
          r.branch(tiers.contains(PRO), PRO, PERSONAL)
        )
      })
  })) as Promise<HubspotTraits[]>
}

interface Traits {
  avatar: string
  createdAt: Date
  email: string
  id: string
  parabolId: string
  parabolPreferredName: string
}

const getTraits = (userIds: string[]) => {
  const r = getRethink()
  return r
    .table('User')
    .getAll(r.args(userIds), {index: 'id'})
    .map({
      avatar: r.row('picture').default(''),
      createdAt: r.row('createdAt').default(0),
      email: r.row('email').default(''),
      id: r.row('id').default(''),
      parabolId: r.row('id').default(''), // passed as a distinct trait name for HubSpot
      parabolPreferredName: r.row('preferredName').default('')
    }) as Promise<Traits[]>
}

const getOrgId = (teamId) => {
  const r = getRethink()
  return teamId ? r.table('Team').get(teamId)('orgId') : undefined
}

const getSegmentProps = (userIds, teamId) => {
  return resolvePromiseObj({
    traitsArr: getTraits(userIds),
    orgId: getOrgId(teamId)
  })
}

export const sendSegmentIdentify = async (maybeUserIds) => {
  const userIds = Array.isArray(maybeUserIds) ? maybeUserIds : [maybeUserIds]
  const [traitsArr, hubspotTraitsArr] = await Promise.all([
    getTraits(userIds),
    getHubspotTraits(userIds)
  ])
  traitsArr.forEach(async (traitsWithId) => {
    const {id: userId, ...traits} = {
      ...traitsWithId,
      ...hubspotTraitsArr.find((hubspotTraitsWithId) => traitsWithId.id === hubspotTraitsWithId.id)
    }
    const tiersCountTraits = await countTiersForUserId(userId)
    segmentIo.identify({
      userId,
      traits: {
        ...traits,
        ...tiersCountTraits
      }
    })
  })
}

interface Options extends ISegmentEventTrackOptions {
  [key: string]: any
}

const sendSegmentEvent = async (
  event: string,
  maybeUserIds: string | string[],
  options: Options = {}
) => {
  const userIds = Array.isArray(maybeUserIds) ? maybeUserIds : [maybeUserIds]
  const {traitsArr, orgId} = await getSegmentProps(userIds, options.teamId)
  traitsArr.forEach((traitsWithId) => {
    const {id: userId, ...traits} = traitsWithId
    segmentIo.track({
      userId,
      event,
      properties: {
        orgId,
        traits,
        // options is a superset of SegmentEventTrackOptions
        ...options
      }
    })
  })
}

export default sendSegmentEvent

import {GraphQLID, GraphQLNonNull} from 'graphql'
import stripe from '../../billing/stripe'
import getRethink from '../../database/rethinkDriver'
import DowngradeToPersonalPayload from '../types/DowngradeToPersonalPayload'
import {getUserId, isUserBillingLeader, isSuperUser} from '../../utils/authorization'
import publish from '../../utils/publish'
import sendSegmentEvent, {sendSegmentIdentify} from '../../utils/sendSegmentEvent'
import {ORGANIZATION, PERSONAL, TEAM} from '../../../client/utils/constants'
import standardError from '../../utils/standardError'

export default {
  type: DowngradeToPersonalPayload,
  description: 'Downgrade a paid account to the personal service',
  args: {
    orgId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'the org requesting the upgrade'
    }
  },
  async resolve (_source, {orgId}, {authToken, dataLoader, socketId: mutatorId}) {
    const r = getRethink()
    const now = new Date()
    const operationId = dataLoader.share()
    const subOptions = {mutatorId, operationId}

    // AUTH
    const viewerId = getUserId(authToken)
    if (!isSuperUser(authToken)) {
      if (!(await isUserBillingLeader(viewerId, orgId, dataLoader))) {
        return standardError(new Error('Not organization leader'), {userId: viewerId})
      }
    }

    // VALIDATION
    const {stripeSubscriptionId, tier} = await r.table('Organization').get(orgId)

    if (tier === PERSONAL) {
      return standardError(new Error('Already on free tier'), {userId: viewerId})
    }

    // RESOLUTION
    // if they downgrade & are re-upgrading, they'll already have a stripeId
    try {
      await stripe.subscriptions.del(stripeSubscriptionId)
    } catch (e) {
      console.log(e)
    }

    const {teamIds} = await r({
      org: r
        .table('Organization')
        .get(orgId)
        .update({
          creditCard: {},
          tier: PERSONAL,
          periodEnd: now,
          stripeSubscriptionId: null,
          updatedAt: now
        }),
      teamIds: r
        .table('Team')
        .getAll(orgId, {index: 'orgId'})
        .update(
          {
            tier: PERSONAL,
            isPaid: true,
            updatedAt: now
          },
          {returnChanges: true}
        )('changes')('new_val')('id')
        .default([])
    })
    sendSegmentEvent('Downgrade to personal', viewerId, {orgId}).catch()
    const data = {orgId, teamIds}
    publish(ORGANIZATION, orgId, DowngradeToPersonalPayload, data, subOptions)

    teamIds.forEach((teamId) => {
      // I can't readily think of a clever way to use the data obj and filter in the resolver so I'll reduce here.
      // This is probably a smelly piece of code telling me I should be sending this per-viewerId or per-org
      const teamData = {orgId, teamIds: [teamId]}
      publish(TEAM, teamId, DowngradeToPersonalPayload, teamData, subOptions)
    })
    // the count of this users tier stats just changed, update:
    const allUserIds = await r
      .table('OrganizationUser')
      .getAll(orgId, {index: 'orgId'})
      .filter({removedAt: null})('userId')
    allUserIds.forEach((userId) => {
      sendSegmentIdentify(userId).catch()
    })
    return data
  }
}

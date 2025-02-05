import {GraphQLID, GraphQLNonNull} from 'graphql'
import AddGitHubAuthPayload from '../types/AddGitHubAuthPayload'
import {getUserId, isTeamMember} from '../../utils/authorization'
import shortid from 'shortid'
import {GITHUB} from '../../../client/utils/constants'
import getRethink from '../../database/rethinkDriver'
import GitHubManager from '../../utils/GitHubManager'
import standardError from '../../utils/standardError'

export default {
  name: 'AddGitHubAuth',
  type: new GraphQLNonNull(AddGitHubAuthPayload),
  args: {
    code: {
      type: new GraphQLNonNull(GraphQLID)
    },
    teamId: {
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  resolve: async (_source, {code, teamId}, {authToken}) => {
    const viewerId = getUserId(authToken)

    // AUTH
    if (!isTeamMember(authToken, teamId)) {
      return standardError(new Error('Attempted teamId spoof'), {userId: viewerId})
    }

    // RESOLUTION
    const r = getRethink()
    const now = new Date()

    const manager = await GitHubManager.init(code)
    const {accessToken} = manager
    const profile = await manager.getProfile()

    if ('message' in profile) {
      return standardError(new Error(profile.message), {userId: viewerId})
    }

    if (Array.isArray(profile.errors)) {
      console.error(profile.errors[0])
      return standardError(new Error(profile.errors[0].message), {userId: viewerId})
    }

    const {data: profileData} = profile
    if (!profileData || !profileData.viewer) {
      return standardError(new Error('No profileData provided from GitHub'), {userId: viewerId})
    }
    const {viewer} = profileData
    const {login} = viewer
    await r
      .table('Provider')
      .getAll(teamId, {index: 'teamId'})
      .filter({service: GITHUB, userId: viewerId})
      .nth(0)('id')
      .default(null)
      .do((providerId) => {
        return r.branch(
          providerId.eq(null),
          r.table('Provider').insert(
            {
              id: shortid.generate(),
              accessToken,
              createdAt: now,
              isActive: true,
              providerUserId: login,
              providerUserName: login,
              service: GITHUB,
              teamId,
              updatedAt: now,
              userId: viewerId
            },
            {returnChanges: true}
          )('changes')(0),
          r
            .table('Provider')
            .get(providerId)
            .update(
            {
              accessToken,
              isActive: true,
              updatedAt: now,
              providerUserId: login,
              providerUserName: login
            },
              {returnChanges: true}
            )('changes')(0)
        )
      })
    return {teamId, userId: viewerId}
  }
}

import {GraphQLBoolean, GraphQLID, GraphQLNonNull} from 'graphql'
import ms from 'ms'
import getRethink from '../../database/rethinkDriver'
import getPubSub from '../../utils/getPubSub'
import {DONE, GITHUB} from '../../../client/utils/constants'
import getTagsFromEntityMap from '../../../client/utils/draftjs/getTagsFromEntityMap'
import removeAllRangesForEntity from '../../../client/utils/draftjs/removeAllRangesForEntity'

export default {
  name: 'GitHubAddAssignee',
  description: 'Receive a webhook from github saying an assignee was added',
  type: GraphQLBoolean,
  args: {
    integrationId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The github issue id'
    },
    assigneeLogin: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The github login for the new assignee'
    },
    nameWithOwner: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The repo name and owner'
    }
  },
  resolve: async (source, {integrationId, assigneeLogin, nameWithOwner}, {serverSecret}) => {
    const r = getRethink()
    const now = new Date()
    // AUTH
    if (serverSecret !== process.env.AUTH0_CLIENT_SECRET) {
      throw new Error('Don’t be rude.')
    }

    const integrations = await r.table(GITHUB).getAll(nameWithOwner, {index: 'nameWithOwner'})

    if (integrations.length === 0) {
      throw new Error(`No integrations for ${nameWithOwner}`)
    }

    // plural for each organization
    const providers = await r
      .table('Provider')
      .getAll(assigneeLogin, {index: 'providerUserId'})
      .filter({service: GITHUB, isActive: true})
    // .nth(0)('userId')
    // .default(null);

    if (providers.length === 0) {
      throw new Error(`${assigneeLogin} does not have a GitHub integration with Parabol`)
    }

    const tasks = await r.table('Task').getAll(integrationId, {index: 'integrationId'})

    const maybeUpdateTask = (integration) => {
      const {teamId, userIds} = integration
      const provider = providers.find((prov) => prov.teamId === teamId)
      const task = tasks.find((proj) => proj.teamId === teamId)

      if (!provider) {
        throw new Error(
          `${assigneeLogin} does not have a GitHub integration with Parabol for ${teamId}`
        )
      }
      const {userId} = provider
      if (!task) {
        // TODO create a new task for this team
        return false
      }
      const {content, status, tags, updatedAt} = task
      if (!userIds.includes(userId)) {
        // This user doesn't want to own the task, so ignore
        return false
      }
      const teamMemberId = `${userId}::${teamId}`
      const updateObj = {
        teamMemberId,
        updatedAt: now
      }
      // see if they unassigned someone before assigning a new person. not perfect, but probably close
      if (tags.includes('archived') && (status !== DONE || updatedAt > now - ms('5m'))) {
        const eqFn = (data) => data.value === 'archived'
        const nextContent = removeAllRangesForEntity(content, 'TAG', eqFn)
        if (nextContent) {
          updateObj.content = nextContent
          const {entityMap} = JSON.parse(nextContent)
          updateObj.tags = getTagsFromEntityMap(entityMap)
        }
      }

      const taskUpdated = {
        ...updateObj,
        id: task.id
      }
      // TODO set this up
      getPubSub().publish(`taskUpdated.${teamId}`, {taskUpdated})
      return r
        .table('Task')
        .get(task.id)
        .update(updateObj)
        .run()
    }

    await Promise.all(integrations.map(maybeUpdateTask))
    return true
  }
}

import {GraphQLBoolean, GraphQLID, GraphQLNonNull} from 'graphql'
import EditTaskPayload from '../types/EditTaskPayload'
import {getUserId, isTeamMember} from '../../utils/authorization'
import publish from '../../utils/publish'
import {TASK} from '../../../client/utils/constants'
import standardError from '../../utils/standardError'

export default {
  type: EditTaskPayload,
  description: 'Announce to everyone that you are editing a task',
  args: {
    taskId: {
      type: new GraphQLNonNull(GraphQLID),
      description: 'The task id that is being edited'
    },
    isEditing: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'true if the editing is starting, false if it is stopping'
    }
  },
  async resolve (source, {taskId, isEditing}, {authToken, dataLoader, socketId: mutatorId}) {
    const operationId = dataLoader.share()
    const subOptions = {mutatorId, operationId}

    // AUTH
    const task = await dataLoader.get('tasks').load(taskId)
    const viewerId = getUserId(authToken)
    const {tags, teamId, userId: taskUserId} = task
    if (!isTeamMember(authToken, teamId)) {
      return standardError(new Error('Team not found'), {userId: viewerId})
    }

    // RESOLUTION
    // grab the task to see if it's private, don't share with other if it is
    const teamMembers = await dataLoader.get('teamMembersByTeamId').load(teamId)
    const isPrivate = tags.includes('private')
    const data = {taskId, editorId: viewerId, isEditing}
    teamMembers.forEach((teamMember) => {
      const {userId} = teamMember
      if (!isPrivate || taskUserId === userId) {
        publish(TASK, userId, EditTaskPayload, data, subOptions)
      }
    })
    return data
  }
}

import {GraphQLFloat, GraphQLID, GraphQLNonNull} from 'graphql'
import getRethink from '../../database/rethinkDriver'
import DragDiscussionTopicPayload from '../types/DragDiscussionTopicPayload'
import {getUserId, isTeamMember} from '../../utils/authorization'
import publish from '../../utils/publish'
import {DISCUSS, TEAM} from '../../../client/utils/constants'
import standardError from '../../utils/standardError'

export default {
  description: 'Changes the priority of the discussion topics',
  type: DragDiscussionTopicPayload,
  args: {
    meetingId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    stageId: {
      type: new GraphQLNonNull(GraphQLID)
    },
    sortOrder: {
      type: new GraphQLNonNull(GraphQLFloat)
    }
  },
  async resolve (
    source,
    {meetingId, stageId, sortOrder},
    {authToken, dataLoader, socketId: mutatorId}
  ) {
    const r = getRethink()
    const operationId = dataLoader.share()
    const subOptions = {operationId, mutatorId}
    const viewerId = getUserId(authToken)

    // AUTH
    const meeting = await r.table('NewMeeting').get(meetingId)
    if (!meeting) return standardError(new Error('Meeting not found'), {userId: viewerId})
    const {endedAt, phases, teamId} = meeting
    if (!isTeamMember(authToken, teamId)) {
      return standardError(new Error('Team not found'), {userId: viewerId})
    }
    if (endedAt) return standardError(new Error('Meeting already ended'), {userId: viewerId})
    const discussPhase = phases.find((phase) => phase.phaseType === DISCUSS)
    if (!discussPhase) {
      return standardError(new Error('Meeting stage not found'), {userId: viewerId})
    }
    const {stages} = discussPhase
    const draggedStage = stages.find((stage) => stage.id === stageId)
    if (!draggedStage) {
      return standardError(new Error('Meeting stage not found'), {userId: viewerId})
    }

    // RESOLUTION
    // MUTATIVE
    draggedStage.sortOrder = sortOrder
    stages.sort((a, b) => {
      return a.sortOrder > b.sortOrder ? 1 : -1
    })
    await r
      .table('NewMeeting')
      .get(meetingId)
      .update({
        phases
      })

    const data = {
      meetingId,
      stageId
    }
    publish(TEAM, teamId, DragDiscussionTopicPayload, data, subOptions)
    return data
  }
}

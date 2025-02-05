import {GraphQLID, GraphQLObjectType} from 'graphql'
import {makeResolve, resolveNewMeeting} from '../resolvers'
import StandardMutationError from './StandardMutationError'
import RetroReflection from './RetroReflection'
import DragContext from './DragContext'
import NewMeeting from './NewMeeting'

const StartDraggingReflectionPayload = new GraphQLObjectType({
  name: 'StartDraggingReflectionPayload',
  fields: () => ({
    error: {
      type: StandardMutationError
    },
    dragContext: {
      type: DragContext,
      description:
        'The proposed start/end of a drag. Subject to race conditions, it is up to the client to decide to accept or ignore'
    },
    meeting: {
      type: NewMeeting,
      resolve: resolveNewMeeting
    },
    meetingId: {
      type: GraphQLID
    },
    reflection: {
      type: RetroReflection,
      resolve: makeResolve('reflectionId', 'reflection', 'retroReflections')
    },
    reflectionId: {
      type: GraphQLID
    },
    teamId: {
      type: GraphQLID
    }
  })
})

export default StartDraggingReflectionPayload

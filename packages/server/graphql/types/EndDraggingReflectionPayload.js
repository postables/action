import {GraphQLID, GraphQLObjectType} from 'graphql'
import {makeResolve, resolveNewMeeting} from '../resolvers'
import StandardMutationError from './StandardMutationError'
import RetroReflection from './RetroReflection'
import DragReflectionDropTargetTypeEnum from '../mutations/DragReflectionDropTargetTypeEnum'
import RetroReflectionGroup from './RetroReflectionGroup'
import RetrospectiveMeeting from './RetrospectiveMeeting'

const EndDraggingReflectionPayload = new GraphQLObjectType({
  name: 'EndDraggingReflectionPayload',
  fields: () => ({
    error: {
      type: StandardMutationError
    },
    dragId: {
      type: GraphQLID
    },
    dropTargetType: {
      type: DragReflectionDropTargetTypeEnum,
      description: 'the type of item the reflection was dropped on'
    },
    dropTargetId: {
      type: GraphQLID,
      description:
        'The ID that the dragged item was dropped on, if dropTargetType is not specific enough'
    },
    meeting: {
      type: RetrospectiveMeeting,
      resolve: resolveNewMeeting
    },
    meetingId: {
      type: GraphQLID
    },
    reflection: {
      type: RetroReflection,
      resolve: makeResolve('reflectionId', 'reflection', 'retroReflections')
    },
    reflectionGroupId: {
      type: GraphQLID
    },
    reflectionId: {
      type: GraphQLID
    },
    userId: {
      type: GraphQLID,
      description: 'foreign key to get user'
    },
    reflectionGroup: {
      type: RetroReflectionGroup,
      description:
        'The group encapsulating the new reflection. A new one was created if one was not provided.',
      resolve: makeResolve('reflectionGroupId', 'reflectionGroup', 'retroReflectionGroups')
    },
    oldReflectionGroup: {
      type: RetroReflectionGroup,
      description: 'The old group the reflection was in',
      resolve: makeResolve('oldReflectionGroupId', 'oldReflectionGroup', 'retroReflectionGroups')
    }
  })
})

export default EndDraggingReflectionPayload

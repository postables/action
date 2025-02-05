import {commitMutation} from 'react-relay'
import getBaseRecord from '../utils/relay/getBaseRecord'
import {moveReflectionLocation} from './EndDraggingReflectionMutation'
import initializeGrid from '../utils/multiplayerMasonry/initializeGrid'
import graphql from 'babel-plugin-relay/macro'

graphql`
  fragment AutoGroupReflectionsMutation_team on AutoGroupReflectionsPayload {
    meeting {
      id
      nextAutoGroupThreshold
    }
    reflections {
      id
      reflectionGroupId
      sortOrder
    }
    reflectionGroups {
      title
      smartTitle
    }
    removedReflectionGroups {
      id
    }
  }
`

export const autoGroupReflectionsTeamUpdater = (payload, {store}) => {
  const reflections = payload.getLinkedRecords('reflections')
  reflections.forEach((reflection) => {
    const baseRecord = getBaseRecord(store, reflection.getValue('id'))
    const {reflectionGroupId: oldReflectionGroupId} = baseRecord
    const reflectionGroupId = reflection.getValue('reflectionGroupId')
    const reflectionGroup = store.get(reflectionGroupId)
    moveReflectionLocation(reflection, reflectionGroup, oldReflectionGroupId, store)
  })
}

export const autoGroupReflectionsTeamOnNext = (payload, {atmosphere}) => {
  const {removedReflectionGroups} = payload
  if (atmosphere.getMasonry) {
    const {itemCache, childrenCache, parentCache} = atmosphere.getMasonry()
    removedReflectionGroups.forEach(({id}) => delete childrenCache[id])
    initializeGrid(itemCache, childrenCache, parentCache, true)
  }
}

const mutation = graphql`
  mutation AutoGroupReflectionsMutation($meetingId: ID!, $groupingThreshold: Float!) {
    autoGroupReflections(meetingId: $meetingId, groupingThreshold: $groupingThreshold) {
      ...AutoGroupReflectionsMutation_team @relay(mask: false)
    }
  }
`

const AutoGroupReflectionsMutation = (atmosphere, variables, onError, onCompleted) => {
  return commitMutation(atmosphere, {
    mutation,
    variables,
    updater: (store) => {
      const payload = store.getRootField('autoGroupReflections')
      if (!payload) return
      autoGroupReflectionsTeamUpdater(payload, {atmosphere, store})
    },
    onCompleted: (res, errors) => {
      if (onCompleted) {
        onCompleted(res, errors)
      }
      autoGroupReflectionsTeamOnNext(res.autoGroupReflections, {atmosphere})
    },
    onError
  })
}

export default AutoGroupReflectionsMutation

import graphql from 'babel-plugin-relay/macro'
graphql`
  fragment CompleteReflectionFrag on RetroReflection {
    id
    content
    editorIds
    isViewerCreator
    meetingId
    reflectionGroupId
    retroReflectionGroup {
      id
    }
    retroPhaseItemId
    sortOrder
    phaseItem {
      id
    }
  }
`

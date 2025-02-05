import {createTaskTaskUpdater} from '../mutations/CreateTaskMutation'
import {deleteTaskTaskUpdater} from '../mutations/DeleteTaskMutation'
import {editTaskTaskUpdater} from '../mutations/EditTaskMutation'
import {updateTaskTaskOnNext, updateTaskTaskUpdater} from '../mutations/UpdateTaskMutation'
import {removeOrgUserTaskUpdater} from '../mutations/RemoveOrgUserMutation'
import {changeTaskTeamTaskUpdater} from '../mutations/ChangeTaskTeamMutation'
import graphql from 'babel-plugin-relay/macro'
import {RecordSourceSelectorProxy} from 'relay-runtime'

const subscription = graphql`
  subscription TaskSubscription {
    taskSubscription {
      __typename
      ...RemoveTeamMemberMutation_task @relay(mask: false)
      ...ChangeTaskTeamMutation_task @relay(mask: false)
      ...CreateGitHubIssueMutation_task @relay(mask: false)
      ...CreateJiraIssueMutation_task @relay(mask: false)
      ...CreateTaskMutation_task @relay(mask: false)
      ...DeleteTaskMutation_task @relay(mask: false)
      ...EditTaskMutation_task @relay(mask: false)
      ...RemoveOrgUserMutation_task @relay(mask: false)
      ...UpdateTaskMutation_task @relay(mask: false)
      ...UpdateTaskDueDateMutation_task @relay(mask: false)
    }
  }
`

const onNextHandlers = {
  UpdateTaskPayload: updateTaskTaskOnNext
}

const TaskSubscription = (atmosphere, _queryVariables, subParams) => {
  const {viewerId} = atmosphere
  return {
    subscription,
    variables: {},
    updater: (store: RecordSourceSelectorProxy) => {
      const payload = store.getRootField('taskSubscription')
      if (!payload) return
      const type = payload.getValue('__typename')
      const context = {atmosphere, store}
      switch (type) {
        case 'CreateGitHubIssuePayload':
          break
        case 'ChangeTaskTeamPayload':
          changeTaskTeamTaskUpdater(payload, context)
          break
        case 'CreateTaskPayload':
          createTaskTaskUpdater(payload, context)
          break
        case 'DeleteTaskPayload':
          deleteTaskTaskUpdater(payload, store, viewerId)
          break
        case 'EditTaskPayload':
          editTaskTaskUpdater(payload, store)
          break
        case 'RemoveOrgUserPayload':
          removeOrgUserTaskUpdater(payload, store, viewerId)
          break
        case 'UpdateTaskPayload':
          updateTaskTaskUpdater(payload, context)
          break
        case 'UpdateTaskDueDatePayload':
          break
        default:
          console.error('TaskSubscription case fail', type)
      }
    },
    onNext: ({taskSubscription}) => {
      const {__typename: type} = taskSubscription
      const handler = onNextHandlers[type]
      if (handler) {
        handler(taskSubscription, {...subParams, atmosphere})
      }
    }
  }
}

export default TaskSubscription

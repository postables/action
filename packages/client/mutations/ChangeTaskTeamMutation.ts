import {commitMutation} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import handleUpsertTasks from './handlers/handleUpsertTasks'
import updateProxyRecord from '../utils/relay/updateProxyRecord'
import handleRemoveNotifications from './handlers/handleRemoveNotifications'
import getInProxy from '../utils/relay/getInProxy'
import safeRemoveNodeFromUnknownConn from '../utils/relay/safeRemoveNodeFromUnknownConn'
import Atmosphere from '../Atmosphere'
import {IChangeTaskTeamOnMutationArguments, ITask, ITeam} from '../types/graphql'
import {RecordProxy, RecordSourceSelectorProxy} from 'relay-runtime'
import getBaseRecord from '../utils/relay/getBaseRecord'
import {ChangeTaskTeamMutation as TChangeTaskTeamMutation} from '../__generated__/ChangeTaskTeamMutation.graphql'
import {LocalHandlers} from '../types/relayMutations'

graphql`
  fragment ChangeTaskTeamMutation_task on ChangeTaskTeamPayload {
    task {
      ...CompleteTaskFrag @relay(mask: false)
      editors {
        userId
        preferredName
      }
    }
    removedNotification {
      id
    }
    removedTaskId
  }
`

const mutation = graphql`
  mutation ChangeTaskTeamMutation($taskId: ID!, $teamId: ID!) {
    changeTaskTeam(taskId: $taskId, teamId: $teamId) {
      error {
        message
      }
      ...ChangeTaskTeamMutation_task @relay(mask: false)
    }
  }
`

export const changeTaskTeamTaskUpdater = (
  payload: RecordProxy,
  {store}: {store: RecordSourceSelectorProxy}
) => {
  const task = payload.getLinkedRecord('task')
  const taskId = (task && task.getValue('id')) || payload.getValue('removedTaskId')
  if (!taskId) return
  const oldTask = getBaseRecord(store, taskId) as Partial<ITask> | null
  if (!oldTask) return
  const oldTeamId = oldTask.teamId || (oldTask.team && oldTask.team.id)
  if (!oldTeamId) return
  safeRemoveNodeFromUnknownConn(store, oldTeamId, 'TeamColumnsContainer_tasks', taskId)
  handleUpsertTasks(task, store)
  const removedNotificationId = getInProxy(payload, 'removedNotification', 'id')
  handleRemoveNotifications(removedNotificationId, store)
}

const ChangeTaskTeamMutation = (
  atmosphere: Atmosphere,
  variables: IChangeTaskTeamOnMutationArguments,
  {onError, onCompleted}: LocalHandlers
) => {
  return commitMutation<TChangeTaskTeamMutation>(atmosphere, {
    mutation,
    variables,
    updater: (store) => {
      const payload = store.getRootField('changeTaskTeam')
      if (!payload) return
      changeTaskTeamTaskUpdater(payload, {store})
    },
    optimisticUpdater: (store) => {
      const {taskId, teamId} = variables
      if (!taskId) return
      const task = store.get<ITask>(taskId)
      if (!task) return
      const now = new Date()
      const optimisticTask = {
        updatedAt: now.toJSON()
      }
      updateProxyRecord(task, optimisticTask)
      task.setValue(teamId, 'teamId')
      const team = store.get<ITeam>(teamId)
      if (team) {
        task.setLinkedRecord(team, 'team')
      }
      handleUpsertTasks(task, store)
    },
    onError,
    onCompleted
  })
}

export default ChangeTaskTeamMutation

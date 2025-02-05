import {commitMutation} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import handleAddNotifications from './handlers/handleAddNotifications'
import handleEditTask from './handlers/handleEditTask'
import handleUpsertTasks from './handlers/handleUpsertTasks'
import popInvolvementToast from './toasts/popInvolvementToast'
import makeEmptyStr from '../utils/draftjs/makeEmptyStr'
import clientTempId from '../utils/relay/clientTempId'
import createProxyRecord from '../utils/relay/createProxyRecord'
import getOptimisticTaskEditor from '../utils/relay/getOptimisticTaskEditor'
import toTeamMemberId from '../utils/relay/toTeamMemberId'
import Atmosphere from '../Atmosphere'
import {
  LocalHandlers,
  OnNextHandler,
  SharedUpdater,
  StandardMutation
} from '../types/relayMutations'
import {CreateTaskMutation as TCreateTaskMutation} from '../__generated__/CreateTaskMutation.graphql'
import {CreateTaskMutation_task} from '../__generated__/CreateTaskMutation_task.graphql'
import {CreateTaskMutation_notification} from '../__generated__/CreateTaskMutation_notification.graphql'

graphql`
  fragment CreateTaskMutation_task on CreateTaskPayload {
    task {
      ...CompleteTaskFrag @relay(mask: false)
    }
  }
`

graphql`
  fragment CreateTaskMutation_notification on CreateTaskPayload {
    involvementNotification {
      ...TaskInvolves_notification @relay(mask: false)
    }
  }
`

const mutation = graphql`
  mutation CreateTaskMutation($newTask: CreateTaskInput!) {
    createTask(newTask: $newTask) {
      error {
        message
      }
      ...CreateTaskMutation_task @relay(mask: false)
    }
  }
`

export const createTaskTaskUpdater: SharedUpdater<CreateTaskMutation_task> = (payload, {store}) => {
  const task = payload.getLinkedRecord('task')
  if (!task) return
  const taskId = task.getValue('id')
  const userId = task.getValue('userId')
  const content = task.getValue('content')
  const rawContent = JSON.parse(content)
  const isEditing = !rawContent.blocks.length
  const editorPayload = getOptimisticTaskEditor(store, userId, taskId, isEditing)
  handleEditTask(editorPayload, store)
  handleUpsertTasks(task, store)
}

export const createTaskNotificationOnNext: OnNextHandler<CreateTaskMutation_notification> = (
  payload,
  {atmosphere, history}
) => {
  if (!payload || !payload.involvementNotification) return
  popInvolvementToast(payload.involvementNotification, {atmosphere, history})
}

export const createTaskNotificationUpdater: SharedUpdater<CreateTaskMutation_notification> = (
  payload,
  {store}
) => {
  const notification = payload.getLinkedRecord('involvementNotification' as any)
  if (!notification) return
  handleAddNotifications(notification, store)
}

const CreateTaskMutation: StandardMutation<TCreateTaskMutation> = (
  atmosphere: Atmosphere,
  variables,
  {onError, onCompleted}: LocalHandlers = {}
) => {
  const {viewerId} = atmosphere
  const {newTask} = variables
  const isEditing = !newTask.content
  return commitMutation<TCreateTaskMutation>(atmosphere, {
    mutation,
    variables,
    updater: (store) => {
      const context = {atmosphere, store}
      const payload = store.getRootField('createTask')
      if (!payload) return
      createTaskTaskUpdater(payload, context)
    },
    optimisticUpdater: (store) => {
      const {teamId, userId} = newTask
      const assigneeId = toTeamMemberId(teamId, userId)
      const now = new Date().toJSON()
      const taskId = clientTempId(teamId)
      const optimisticTask = {
        ...newTask,
        id: taskId,
        teamId,
        userId,
        createdAt: now,
        createdBy: viewerId,
        updatedAt: now,
        tags: [],
        assigneeId,
        content: newTask.content || makeEmptyStr()
      }
      const task = createProxyRecord(store, 'Task', optimisticTask)
        .setLinkedRecord(store.get(assigneeId), 'assignee')
        .setLinkedRecord(store.get(teamId), 'team')
      const editorPayload = getOptimisticTaskEditor(store, userId, taskId, isEditing)
      handleEditTask(editorPayload, store)
      handleUpsertTasks(task as any, store)
    },
    onError,
    onCompleted
  })
}

export default CreateTaskMutation

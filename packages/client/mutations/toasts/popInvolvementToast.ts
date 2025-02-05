import {matchPath} from 'react-router-dom'
import {MENTIONEE} from '../../utils/constants'
import {OnNextHandler} from '../../types/relayMutations'
import {TaskInvolves_notification} from '../../__generated__/TaskInvolves_notification.graphql'

const popInvolvementToast: OnNextHandler<TaskInvolves_notification> = (
  notification,
  {atmosphere, history}
) => {
  if (!notification) return
  const {
    involvement,
    changeAuthor: {preferredName: changeAuthorName},
    task
  } = notification
  const {id: taskId} = task
  const {pathname} = window.location
  const inMeeting =
    Boolean(
      matchPath(pathname, {
        path: '/meeting',
        exact: false,
        strict: false
      })
    ) ||
    matchPath(pathname, {
      path: '/retro',
      exact: false,
      strict: false
    })
  if (inMeeting) return

  const wording = involvement === MENTIONEE ? 'mentioned you in' : 'assigned you to'
  const message = `${changeAuthorName} ${wording} a task`
  atmosphere.eventEmitter.emit('addSnackbar', {
    key: `taskInvolvement:${taskId}`,
    autoDismiss: 10,
    message,
    action: {
      label: 'Check it out!',
      callback: () => {
        history && history.push('/me/notifications')
      }
    }
  })
}

export default popInvolvementToast

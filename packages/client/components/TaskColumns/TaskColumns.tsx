import React, {useMemo} from 'react'
import styled from '@emotion/styled'
import EditorHelpModalContainer from '../../containers/EditorHelpModalContainer/EditorHelpModalContainer'
import TaskColumn from '../../modules/teamDashboard/components/TaskColumn/TaskColumn'
import ui from '../../styles/ui'
import {AreaEnum} from '../../types/graphql'
import {columnArray, MEETING, meetingColumnArray} from '../../utils/constants'
import makeTasksByStatus from '../../utils/makeTasksByStatus'
import {createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import {TaskColumns_tasks} from '../../__generated__/TaskColumns_tasks.graphql'

const RootBlock = styled('div')({
  display: 'flex',
  flex: '1',
  width: '100%'
})

const ColumnsBlock = styled('div')({
  display: 'flex',
  flex: '1',
  margin: '0 auto',
  maxWidth: ui.taskColumnsMaxWidth,
  minWidth: ui.taskColumnsMinWidth,
  padding: `0 ${ui.taskColumnPaddingInnerSmall}`,
  width: '100%',

  [ui.dashBreakpoint]: {
    paddingLeft: ui.taskColumnPaddingInnerLarge,
    paddingRight: ui.taskColumnPaddingInnerLarge
  }
})

interface Props {
  area: AreaEnum
  getTaskById: (taskId: string) => any
  isMyMeetingSection?: boolean
  meetingId?: string
  myTeamMemberId?: string
  tasks: TaskColumns_tasks
  teamMemberFilterId?: string
  teams?: any
}

const TaskColumns = (props: Props) => {
  const {
    area,
    getTaskById,
    isMyMeetingSection,
    meetingId,
    myTeamMemberId,
    teamMemberFilterId,
    teams,
    tasks
  } = props
  const groupedTasks = useMemo(() => {
    return makeTasksByStatus(tasks)
  }, [tasks])
  const lanes = area === MEETING ? meetingColumnArray : columnArray
  return (
    <RootBlock>
      <ColumnsBlock>
        {lanes.map((status) => (
          <TaskColumn
            key={status}
            area={area}
            isMyMeetingSection={isMyMeetingSection}
            getTaskById={getTaskById}
            meetingId={meetingId}
            myTeamMemberId={myTeamMemberId}
            teamMemberFilterId={teamMemberFilterId}
            tasks={groupedTasks[status]}
            status={status}
            teams={teams}
          />
        ))}
      </ColumnsBlock>
      <EditorHelpModalContainer />
    </RootBlock>
  )
}

export default createFragmentContainer(TaskColumns, {
  tasks: graphql`
    fragment TaskColumns_tasks on Task @relay(plural: true) {
      ...TaskColumn_tasks
      status
      sortOrder
    }
  `
})

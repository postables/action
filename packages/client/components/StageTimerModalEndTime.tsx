import SecondaryButton from './SecondaryButton'
import React, {useState} from 'react'
import {createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import styled from '@emotion/styled'
import {StageTimerModalEndTime_stage} from '../__generated__/StageTimerModalEndTime_stage.graphql'
import ms from 'ms'
import SetStageTimerMutation from '../mutations/SetStageTimerMutation'
import useAtmosphere from '../hooks/useAtmosphere'
import useMutationProps from '../hooks/useMutationProps'
import roundDateToNearestHalfHour from '../utils/roundDateToNearestHalfHour'
import '../styles/daypicker.css'
import StageTimerModalEndTimeDate from './StageTimerModalEndTimeDate'
import StageTimerModalEndTimeHour from './StageTimerModalEndTimeHour'
import StageTimerModalEndTimeSlackToggle from './StageTimerModalEndTimeSlackToggle'
import {StageTimerModalEndTime_facilitator} from '../__generated__/StageTimerModalEndTime_facilitator.graphql'
import NotificationErrorMessage from '../modules/notifications/components/NotificationErrorMessage'

interface Props {
  closePortal: () => void
  facilitator: StageTimerModalEndTime_facilitator
  meetingId: string
  stage: StageTimerModalEndTime_stage
  teamId: string
}

const Row = styled('div')({
  alignItems: 'center',
  display: 'flex',
  width: '100%',
  userSelect: 'none'
})

const SetLimit = styled('div')({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  padding: '16px 16px 8px'
})

const StyledButton = styled(SecondaryButton)({
  marginTop: 8,
  minWidth: 192
})

const ErrorMessage = styled(NotificationErrorMessage)({
  marginBottom: -8
})

const DEFAULT_DURATION = ms('1d')
const TOMORROW = roundDateToNearestHalfHour(new Date(Date.now() + DEFAULT_DURATION))

const StageTimerModalEndTime = (props: Props) => {
  const {closePortal, facilitator, meetingId, stage, teamId} = props
  const scheduledEndTime = stage.scheduledEndTime as string | null
  const suggestedEndTime = stage.suggestedEndTime as string | null
  const [endTime, setEndTime] = useState(new Date(scheduledEndTime || suggestedEndTime || TOMORROW))

  const atmosphere = useAtmosphere()

  const {submitting, onError, onCompleted, submitMutation, error} = useMutationProps()

  const startTimer = () => {
    if (submitting || endTime === new Date(scheduledEndTime || 0)) return
    if (endTime.getTime() <= Date.now()) {
      onError(new Error('Time must be in the future'))
      return
    }
    submitMutation()
    SetStageTimerMutation(
      atmosphere,
      {meetingId, scheduledEndTime: endTime},
      {onError, onCompleted}
    )
    closePortal()
  }

  return (
    <SetLimit>
      <Row>
        <StageTimerModalEndTimeDate endTime={endTime} setEndTime={setEndTime} />
      </Row>
      <Row>
        <StageTimerModalEndTimeHour endTime={endTime} setEndTime={setEndTime} />
      </Row>
      <Row>
        <StageTimerModalEndTimeSlackToggle teamId={teamId} facilitator={facilitator} />
      </Row>
      <ErrorMessage error={error} />
      <StyledButton onClick={startTimer}>
        {scheduledEndTime ? 'Update Timebox' : 'Start Timebox'}
      </StyledButton>
    </SetLimit>
  )
}

export default createFragmentContainer(StageTimerModalEndTime, {
  facilitator: graphql`
    fragment StageTimerModalEndTime_facilitator on TeamMember {
      ...StageTimerModalEndTimeSlackToggle_facilitator
    }
  `,
  stage: graphql`
    fragment StageTimerModalEndTime_stage on NewMeetingStage {
      suggestedEndTime
      scheduledEndTime
    }
  `
})

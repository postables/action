import React from 'react'
import DayPicker from 'react-day-picker'
import '../styles/daypicker.css'
import {DayModifiers} from 'react-day-picker/types/common'
import Menu from './Menu'
import {MenuProps} from '../hooks/useMenu'
import UpdateTaskDueDateMutation from '../mutations/UpdateTaskDueDateMutation'
import withAtmosphere, {
  WithAtmosphereProps
} from '../decorators/withAtmosphere/withAtmosphere'
import withMutationProps, {WithMutationProps} from '../utils/relay/withMutationProps'
import {createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import {DueDatePicker_task} from '../__generated__/DueDatePicker_task.graphql'
import styled from '@emotion/styled'
import ui from '../styles/ui'

interface Props extends WithAtmosphereProps, WithMutationProps {
  menuProps: MenuProps
  task: DueDatePicker_task
}

const TallMenu = styled(Menu)({
  maxHeight: 340
})

const PickerTitle = styled('div')({
  fontSize: '.875rem',
  textAlign: 'center',
  userSelect: 'none',
  width: '100%'
})

const Hint = styled('div')({
  fontSize: '.6875rem',
  color: ui.hintFontColor,
  textAlign: 'center'
})

class DueDatePicker extends React.Component<Props> {
  handleDayClick = (day: Date, {disabled, selected}: DayModifiers) => {
    if (disabled) return
    const {
      atmosphere,
      menuProps,
      task: {taskId},
      submitMutation,
      onCompleted,
      onError
    } = this.props
    submitMutation()
    const dueDate = selected ? null : day
    UpdateTaskDueDateMutation(atmosphere, {taskId, dueDate}, onCompleted, onError)
    menuProps.closePortal()
  }

  render () {
    const {
      menuProps,
      task: {dueDate}
    } = this.props
    const selectedDate = dueDate && new Date(dueDate)
    const showHint = false
    const now = new Date()
    const nextYear = new Date(new Date().setFullYear(now.getFullYear() + 1))
    return (
      <TallMenu ariaLabel='Pick a due date' {...menuProps}>
        <PickerTitle>{'Change Due Date'}</PickerTitle>
        {showHint && <Hint>{'To remove, tap selected date'}</Hint>}
        <DayPicker
          disabledDays={{before: now}}
          fromMonth={selectedDate || now}
          initialMonth={selectedDate || now}
          onDayClick={this.handleDayClick}
          selectedDays={selectedDate}
          toMonth={nextYear}
        />
      </TallMenu>
    )
  }
}

export default createFragmentContainer(withAtmosphere(withMutationProps(DueDatePicker)), {
  task: graphql`
    fragment DueDatePicker_task on Task {
      taskId: id
      dueDate
    }
  `
})

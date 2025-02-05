import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {createFragmentContainer} from 'react-relay'
import EditingStatus from '../../components/EditingStatus/EditingStatus'
import getRefreshPeriod from '../../utils/getRefreshPeriod'
import graphql from 'babel-plugin-relay/macro'
class EditingStatusContainer extends Component {
  static propTypes = {
    cardIsActive: PropTypes.bool,
    isEditing: PropTypes.bool,
    task: PropTypes.object.isRequired,
    toggleMenuState: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)
    this.state = {
      timestampType: 'createdAt'
    }
  }

  componentWillUnmount () {
    this.resetTimeout()
  }

  toggleTimestamp = () => {
    const timestampType = this.state.timestampType === 'createdAt' ? 'updatedAt' : 'createdAt'
    this.setState({timestampType})
  }

  resetTimeout () {
    clearTimeout(this.refreshTimer)
    this.refreshTimer = undefined
  }

  queueNextRender () {
    this.resetTimeout()
    const {
      task: {createdAt, updatedAt}
    } = this.props
    const timestamp = this.state.timestampType === 'createdAt' ? createdAt : updatedAt
    const timeTilRefresh = getRefreshPeriod(timestamp)
    this.refreshTimer = setTimeout(() => {
      this.forceUpdate()
    }, timeTilRefresh)
  }

  render () {
    const {cardIsActive, isEditing, task, toggleMenuState} = this.props
    const {createdAt, updatedAt} = task
    const {timestampType} = this.state
    this.queueNextRender()
    const timestamp = timestampType === 'createdAt' ? createdAt : updatedAt
    return (
      <EditingStatus
        cardIsActive={cardIsActive}
        handleClick={this.toggleTimestamp}
        isEditing={isEditing}
        task={task}
        timestamp={timestamp}
        timestampType={timestampType}
        toggleMenuState={toggleMenuState}
      />
    )
  }
}

export default createFragmentContainer(EditingStatusContainer, {
  task: graphql`
    fragment EditingStatusContainer_task on Task {
      createdAt
      updatedAt
      ...EditingStatus_task
    }
  `
})

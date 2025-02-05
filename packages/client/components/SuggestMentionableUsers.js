import PropTypes from 'prop-types'
import React, {Component} from 'react'
import {createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import stringScore from 'string-score'
import AsyncEditorSuggestions from './AsyncEditorSuggestions'
import MentionUser from './MentionUser/MentionUser'
import withAtmosphere from '../decorators/withAtmosphere/withAtmosphere'

const makeSuggestions = (triggerWord, teamMembers) => {
  if (!triggerWord) {
    return teamMembers.slice(0, 6)
  }
  return (
    teamMembers
      .map((teamMember) => {
        const score = stringScore(teamMember.preferredName, triggerWord)
        return {
          ...teamMember,
          score
        }
      })
      .sort((a, b) => (a.score < b.score ? 1 : -1))
      .slice(0, 6)
      // If you type "Foo" and the options are "Foo" and "Giraffe", remove "Giraffe"
      .filter((obj, idx, arr) => obj.score > 0 && arr[0].score - obj.score < 0.3)
  )
}

class SuggestMentionableUsers extends Component {
  componentWillMount () {
    const {
      triggerWord,
      viewer: {
        team: {teamMembers}
      }
    } = this.props

    this._setSuggestions(triggerWord, teamMembers)
  }

  componentWillReceiveProps (nextProps) {
    const {
      triggerWord,
      viewer: {
        team: {teamMembers}
      }
    } = nextProps
    if (
      this.props.viewer.team.teamMembers !== teamMembers ||
      this.props.triggerWord !== triggerWord
    ) {
      this._setSuggestions(triggerWord, teamMembers)
    }
  }

  _setSuggestions (triggerWord, teamMembers) {
    const {setSuggestions} = this.props
    const suggestions = makeSuggestions(triggerWord, teamMembers)
    setSuggestions(suggestions)
  }

  render () {
    const {activeIdx, handleSelect, suggestions} = this.props
    return (
      <AsyncEditorSuggestions
        activeIdx={activeIdx}
        handleSelect={handleSelect}
        suggestions={suggestions}
        SuggestionItem={MentionUser}
      />
    )
  }
}

SuggestMentionableUsers.propTypes = {
  activeIdx: PropTypes.number.isRequired,
  handleSelect: PropTypes.func.isRequired,
  atmosphere: PropTypes.object.isRequired,
  setSuggestions: PropTypes.func.isRequired,
  suggestions: PropTypes.array,
  triggerWord: PropTypes.string.isRequired,
  viewer: PropTypes.object.isRequired
}

export default createFragmentContainer(withAtmosphere(SuggestMentionableUsers), {
  viewer: graphql`
    fragment SuggestMentionableUsers_viewer on User {
      team(teamId: $teamId) {
        teamMembers(sortBy: "preferredName") {
          id
          picture
          preferredName
        }
      }
    }
  `
})

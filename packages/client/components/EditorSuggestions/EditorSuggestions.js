import {css} from 'aphrodite-local-styles/no-important'
import React from 'react'
import MentionTag from '../MentionTag/MentionTag'
import MentionUser from '../MentionUser/MentionUser'
import appTheme from '../../styles/theme/appTheme'
import ui from '../../styles/ui'
import withStyles from '../../styles/withStyles'
import PropTypes from 'prop-types'

const dontTellDraft = (e) => {
  e.preventDefault()
}

const suggestionTypes = {
  tag: MentionTag,
  mention: MentionUser
}

const EditorSuggestions = (props) => {
  const {active, handleSelect, isClosing, innerRef, styles, suggestions, suggestionType} = props

  const SuggestionItem = suggestionTypes[suggestionType]

  const menuStyles = css(styles.mentionMenu, isClosing && styles.closing)
  return (
    <div className={menuStyles} ref={innerRef}>
      {suggestions.map((suggestion, idx) => {
        return (
          // eslint-disable-next-line
          <div key={idx} onMouseDown={dontTellDraft} onClick={handleSelect(idx)}>
            <SuggestionItem active={active === idx} {...suggestion} />
          </div>
        )
      })}
    </div>
  )
}

EditorSuggestions.propTypes = {
  active: PropTypes.number,
  handleSelect: PropTypes.func.isRequired,
  isClosing: PropTypes.bool,
  left: PropTypes.number,
  innerRef: PropTypes.func,
  styles: PropTypes.object,
  suggestions: PropTypes.array,
  suggestionType: PropTypes.string,
  top: PropTypes.number
}

const styleThunk = () => ({
  mentionMenu: {
    color: ui.palette.dark
  },

  active: {
    backgroundColor: appTheme.palette.dark,
    color: '#fff'
  },

  description: {
    marginLeft: '.5rem'
  },

  row: {
    alignItems: 'center',
    cursor: 'pointer',
    display: 'flex',
    padding: '.5rem'
  },

  value: {
    fontWeight: 600
  }
})

export default withStyles(styleThunk)(EditorSuggestions)

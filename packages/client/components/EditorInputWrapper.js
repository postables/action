import {css} from 'aphrodite-local-styles/no-important'
import {Editor, EditorState, getDefaultKeyBinding} from 'draft-js'
import PropTypes from 'prop-types'
import React, {Component} from 'react'
import './TaskEditor/Draft.css'
import withKeyboardShortcuts from './TaskEditor/withKeyboardShortcuts'
import withMarkdown from './TaskEditor/withMarkdown'
import appTheme from '../styles/theme/appTheme'
import withStyles from '../styles/withStyles'
import {textTags} from '../utils/constants'
import entitizeText from '../utils/draftjs/entitizeText'

class EditorInputWrapper extends Component {
  static propTypes = {
    ariaLabel: PropTypes.string,
    editorState: PropTypes.object.isRequired,
    handleBeforeInput: PropTypes.func,
    handleChange: PropTypes.func,
    handleKeyCommand: PropTypes.func,
    handleReturn: PropTypes.func,
    keyBindingFn: PropTypes.func,
    placeholder: PropTypes.string,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    readOnly: PropTypes.bool,
    setEditorState: PropTypes.func,
    innerRef: PropTypes.func,
    styles: PropTypes.object
  }

  blockStyleFn = (contentBlock) => {
    const {styles} = this.props
    const type = contentBlock.getType()
    if (type === 'blockquote') {
      return css(styles.editorBlockquote)
    } else if (type === 'code-block') {
      return css(styles.codeBlock)
    }
    return undefined
  }

  handleChange = (editorState) => {
    const {handleChange, setEditorState} = this.props
    if (this.entityPasteStart) {
      const {anchorOffset, anchorKey} = this.entityPasteStart
      const selectionState = editorState.getSelection().merge({
        anchorOffset,
        anchorKey
      })
      const contentState = entitizeText(editorState.getCurrentContent(), selectionState)
      this.entityPasteStart = undefined
      if (contentState) {
        setEditorState(EditorState.push(editorState, contentState, 'apply-entity'))
        return
      }
    }
    if (editorState.getSelection().getHasFocus() && handleChange) {
      handleChange(editorState)
    }
    setEditorState(editorState)
  }

  handleReturn = (e) => {
    const {handleReturn} = this.props
    if (handleReturn) {
      return handleReturn(e)
    }
    if (e.shiftKey || !this.editorRef) {
      return 'not-handled'
    }
    this.editorRef.blur()
    return 'handled'
  }

  handleKeyCommand = (command) => {
    const {handleKeyCommand} = this.props
    if (handleKeyCommand) {
      return handleKeyCommand(command)
    }
    return undefined
  }

  keyBindingFn = (e) => {
    const {keyBindingFn} = this.props
    if (keyBindingFn) {
      const result = keyBindingFn(e)
      if (result) {
        return result
      }
    }
    return getDefaultKeyBinding(e)
  }

  handleBeforeInput = (char) => {
    const {handleBeforeInput} = this.props
    if (handleBeforeInput) {
      return handleBeforeInput(char)
    }
    return undefined
  }

  handlePastedText = (text) => {
    if (text) {
      for (let i = 0; i < textTags.length; i++) {
        const tag = textTags[i]
        if (text.indexOf(tag) !== -1) {
          const selection = this.props.editorState.getSelection()
          this.entityPasteStart = {
            anchorOffset: selection.getAnchorOffset(),
            anchorKey: selection.getAnchorKey()
          }
        }
      }
    }
    return 'not-handled'
  }

  render () {
    const {ariaLabel, editorState, onBlur, placeholder, readOnly, innerRef} = this.props
    return (
      <Editor
        spellCheck
        ariaLabel={ariaLabel}
        blockStyleFn={this.blockStyleFn}
        editorState={editorState}
        handleBeforeInput={this.handleBeforeInput}
        handleKeyCommand={this.handleKeyCommand}
        handlePastedText={this.handlePastedText}
        handleReturn={this.handleReturn}
        keyBindingFn={this.keyBindingFn}
        onBlur={onBlur}
        onChange={this.handleChange}
        placeholder={placeholder}
        readOnly={readOnly}
        ref={(c) => {
          if (innerRef) {
            innerRef(c)
          }
          this.editorRef = c
        }}
      />
    )
  }
}

const styleThunk = () => ({
  editorBlockquote: {
    fontStyle: 'italic',
    borderLeft: `.25rem ${appTheme.palette.mid40a} solid`,
    margin: '.5rem 0',
    padding: '0 .5rem'
  },

  codeBlock: {
    backgroundColor: appTheme.palette.light,
    borderLeft: `.125rem ${appTheme.palette.mid40a} solid`,
    borderRadius: '.0625rem',
    fontFamily: appTheme.typography.monospace,
    fontSize: appTheme.typography.s2,
    lineHeight: appTheme.typography.s6,
    margin: '0',
    padding: '0 .5rem'
  }
})

export default withMarkdown(withKeyboardShortcuts(withStyles(styleThunk)(EditorInputWrapper)))

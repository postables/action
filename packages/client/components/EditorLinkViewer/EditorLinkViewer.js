import {css} from 'aphrodite-local-styles/no-important'
import React, {Component} from 'react'
import FlatButton from '../FlatButton'
import removeLink from '../../utils/draftjs/removeLink'
import appTheme from '../../styles/theme/appTheme'
import ui from '../../styles/ui'
import withStyles from '../../styles/withStyles'
import PropTypes from 'prop-types'
import dontTellDraft from '../../utils/draftjs/dontTellDraft'
import textOverflow from '../../styles/helpers/textOverflow'

class EditorLinkViewer extends Component {
  render () {
    const {href, styles, addHyperlink, innerRef} = this.props

    const menuStyles = css(styles.modal)

    const handleRemove = () => {
      const {editorState, setEditorState, removeModal} = this.props
      setEditorState(removeLink(editorState))
      removeModal()
    }

    const changeLink = () => {
      addHyperlink()
    }

    return (
      <div className={menuStyles} onMouseDown={dontTellDraft} ref={innerRef}>
        <span className={css(styles.url)}>
          <a className={css(styles.linkText)} href={href} rel='noopener noreferrer' target='_blank'>
            {href}
          </a>
        </span>
        <FlatButton onClick={changeLink} palette='mid'>
          {'Change'}
        </FlatButton>
        <FlatButton onClick={handleRemove} palette='mid'>
          {'Remove'}
        </FlatButton>
      </div>
    )
  }
}

EditorLinkViewer.propTypes = {
  addHyperlink: PropTypes.func.isRequired,
  href: PropTypes.string,
  editorState: PropTypes.object,
  isClosing: PropTypes.bool,
  left: PropTypes.number,
  removeModal: PropTypes.func.isRequired,
  setEditorState: PropTypes.func.isRequired,
  innerRef: PropTypes.func,
  styles: PropTypes.object,
  top: PropTypes.number
}

const styleThunk = () => ({
  modal: {
    alignItems: 'center',
    color: ui.palette.dark,
    display: 'flex',
    fontSize: appTheme.typography.s5,
    padding: '0 .5rem'
  },

  url: {
    ...textOverflow,
    alignItems: 'center',
    borderRight: `1px solid ${ui.cardBorderColor}`,
    display: 'flex',
    flexShrink: 2,
    fontSize: appTheme.typography.s3,
    lineHeight: '2rem',
    marginRight: '.5rem',
    padding: '0 .75rem'
  },

  linkText: {
    ...textOverflow,
    marginRight: '0.5rem',
    maxWidth: '20rem'
  }
})

export default withStyles(styleThunk)(EditorLinkViewer)

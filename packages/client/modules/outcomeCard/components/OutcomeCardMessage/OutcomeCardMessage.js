import PropTypes from 'prop-types'
import React from 'react'
import withStyles from '../../../../styles/withStyles'
import {css} from 'aphrodite-local-styles/no-important'
import ui from '../../../../styles/ui'
import appTheme from '../../../../styles/theme/appTheme'
import Icon from '../../../../components/Icon'
import {MD_ICONS_SIZE_18} from '../../../../styles/icons'

const OutcomeCardMessage = (props) => {
  const {onClose, message, styles} = props

  const messageInnerStyles = css(styles.messageInner, onClose && styles.onClose)

  return (
    <div className={css(styles.message)}>
      <div className={messageInnerStyles}>
        {message}
        {onClose && (
          <div className={css(styles.messageClose)} onClick={onClose} tabIndex='0'>
            <Icon className={css(styles.messageCloseIcon)}>close</Icon>
          </div>
        )}
      </div>
    </div>
  )
}

OutcomeCardMessage.propTypes = {
  colorPalette: PropTypes.oneOf(['cool', 'dark', 'warm']),
  onClose: PropTypes.func,
  message: PropTypes.string,
  styles: PropTypes.object
}

const textShadow = '0 1px rgba(0, 0, 0, .15)'

const styleThunk = (theme, {colorPalette}) => ({
  message: {
    padding: `0 ${ui.cardPaddingBase} ${ui.cardPaddingBase}`
  },

  onClose: {
    paddingRight: '1.375rem'
  },

  messageInner: {
    backgroundColor: ui.palette[colorPalette] || ui.palette.warm,
    borderRadius: ui.borderRadiusSmall,
    color: '#fff',
    display: 'block',
    fontWeight: 600,
    fontSize: appTheme.typography.s2,
    lineHeight: appTheme.typography.s4,
    padding: ui.cardPaddingBase,
    position: 'relative',
    textShadow
  },

  messageClose: {
    cursor: 'pointer',
    fontSize: 0,
    outline: 'none',
    padding: '.25rem',
    position: 'absolute',
    right: 0,
    textShadow,
    top: 0,

    ':hover': {
      opacity: '.5'
    },
    ':focus': {
      opacity: '.5'
    }
  },

  messageCloseIcon: {
    color: '#fff',
    fontSize: `${MD_ICONS_SIZE_18} !important`
  }
})

export default withStyles(styleThunk)(OutcomeCardMessage)

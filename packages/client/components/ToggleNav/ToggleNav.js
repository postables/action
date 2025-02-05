import PropTypes from 'prop-types'
import React from 'react'
import withStyles from '../../styles/withStyles'
import {css} from 'aphrodite-local-styles/no-important'
import appTheme from '../../styles/theme/appTheme'
import ui from '../../styles/ui'
import Icon from '../Icon'
import {MD_ICONS_SIZE_18} from '../../styles/icons'

//    TODO:
//  • Add themes, not just mid/purple (TA)
//  • Make icons optional (TA)
//  • Add disabled styles (TA)

const iconStyles = {
  fontSize: MD_ICONS_SIZE_18,
  lineHeight: MD_ICONS_SIZE_18,
  marginRight: '.25rem',
  verticalAlign: 'middle'
}

const ToggleNav = (props) => {
  const {items, styles} = props

  const renderItems = () =>
    items.map((item, index) => {
      const itemStyles = css(
        styles.item,
        // Avoid className order conflicts and set active here
        item.isActive && styles.itemActive,
        index === 0 && styles.itemFirst,
        index === items.length - 1 && styles.itemLast
      )
      return (
        <div className={itemStyles} key={item.label} onClick={item.onClick} title={item.label}>
          <Icon style={iconStyles}>{item.icon}</Icon> {item.label}
        </div>
      )
    })

  return <div className={css(styles.nav)}>{renderItems()}</div>
}

ToggleNav.propTypes = {
  items: PropTypes.array.isRequired,
  styles: PropTypes.object
}

ToggleNav.defaultProps = {
  items: [
    {
      label: 'Billing',
      icon: 'credit_card',
      isActive: true,
      onClick: () => {}
    },
    {
      label: 'Members',
      icon: 'group',
      isActive: false,
      onClick: () => {}
    }
  ]
}

const borderRadius = ui.borderRadiusSmall

const styleThunk = () => ({
  nav: {
    display: 'flex',
    width: '100%'
  },

  item: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    border: `1px solid ${appTheme.palette.mid}`,
    borderLeftWidth: 0,
    color: appTheme.palette.mid,
    cursor: 'pointer',
    display: 'flex',
    flex: 1,
    fontSize: appTheme.typography.s3,
    fontWeight: 600,
    justifyContent: 'center',
    lineHeight: '1.625rem',
    textAlign: 'center',
    textDecoration: 'none',

    // NOTE: hover/focus are the same
    // NOTE: overriding anchor styles
    ':hover': {
      backgroundColor: appTheme.palette.mid10a,
      color: appTheme.palette.mid70d,
      textDecoration: 'none'
    },
    ':focus': {
      backgroundColor: appTheme.palette.mid10a,
      color: appTheme.palette.mid70d,
      textDecoration: 'none'
    }
  },

  itemActive: {
    backgroundColor: appTheme.palette.mid,
    color: '#fff',
    cursor: 'default',

    // NOTE: hover/focus are the same
    // NOTE: overriding anchor styles
    ':hover': {
      backgroundColor: appTheme.palette.mid,
      color: '#fff'
    },
    ':focus': {
      backgroundColor: appTheme.palette.mid,
      color: '#fff'
    }
  },

  itemFirst: {
    borderBottomLeftRadius: borderRadius,
    borderLeftWidth: 1,
    borderTopLeftRadius: borderRadius
  },

  itemLast: {
    borderBottomRightRadius: borderRadius,
    borderTopRightRadius: borderRadius
  }
})

export default withStyles(styleThunk)(ToggleNav)

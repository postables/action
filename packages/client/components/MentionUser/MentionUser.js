import PropTypes from 'prop-types'
import React from 'react'
import withStyles from '../../styles/withStyles'
import {css} from 'aphrodite-local-styles/no-important'
import mentionBaseStyles from '../MentionBase/mentionBaseStyles'
import Avatar from '../Avatar/Avatar'

const MentionUser = (props) => {
  const {active, preferredName, picture, styles} = props
  const itemStyle = css(styles.row, active && styles.active)
  return (
    <div className={itemStyle}>
      <Avatar picture={picture} size={24} />
      <div className={css(styles.description)}>{preferredName}</div>
    </div>
  )
}

MentionUser.propTypes = {
  active: PropTypes.bool,
  picture: PropTypes.string.isRequired,
  preferredName: PropTypes.string.isRequired,
  styles: PropTypes.object
}

const styleThunk = () => ({
  // includes row, active, description
  ...mentionBaseStyles
})

export default withStyles(styleThunk)(MentionUser)

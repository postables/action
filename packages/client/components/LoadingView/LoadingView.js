import PropTypes from 'prop-types'
import React from 'react'
import withStyles from '../../styles/withStyles'
import {css} from 'aphrodite-local-styles/no-important'
import ui from '../../styles/ui'
import appTheme from '../../styles/theme/appTheme'
import Pato from '../../styles/theme/images/graphics/pato.svg'

const LoadingDuck = (props) => {
  return <img alt={'Duck by Sergey Demushkin'} className={props.className} src={Pato} />
}

LoadingDuck.propTypes = {
  className: PropTypes.string.isRequired
}

const LoadingView = (props) => {
  const {children, styles} = props
  const {pato0, pato1, pato2} = styles
  const duckStyles = [pato0, pato1, pato2]
  return (
    <div className={css(styles.root)}>
      <h1 className={css(styles.heading)}>{'Welcome to Parabol!'}</h1>
      {duckStyles.map((delayClass, idx) => (
        <LoadingDuck
          className={css(delayClass, styles.patoStyles)}
          key={idx} // eslint-disable-line react/no-array-index-key
        />
      ))}
      <h2 className={css(styles.message)}>{'Just putting our ducks in a row…'}</h2>
      {children}
    </div>
  )
}
LoadingView.propTypes = {
  children: PropTypes.any,
  styles: PropTypes.object
}

const patoHop = {
  '0%': {
    transform: 'translate3d(0, 0, 0)'
  },
  '10%': {
    transform: 'translate3d(0, .125rem, 0)'
  },
  '20%': {
    transform: 'translate3d(0, -.5rem, 0) scaleY(1.1)'
  },
  '30%': {
    transform: 'translate3d(0, .25rem, 0) scaleY(.8)'
  },
  '40%': {
    transform: 'translate3d(0, -.125rem, 0) scaleY(1)'
  },
  '45%': {
    transform: 'translate3d(0, 0, 0)'
  },
  '100%': {
    transform: 'translate3d(0, 0, 0)'
  }
}

const cbTiming = 'cubic-bezier(.37, 1.13, .58, 1.13)'

const styleThunk = (theme, minHeight) => ({
  root: {
    minHeight: minHeight || '100vh',
    padding: '3rem 0',
    textAlign: 'center',
    width: '100%'
  },

  heading: {
    color: appTheme.palette.dark,
    fontSize: appTheme.typography.s7,
    fontWeight: 600,
    margin: '0 0 2rem'
  },

  patoStyles: {
    animationDuration: '1.5s',
    animationIterationCount: 'infinite',
    animationName: patoHop,
    animationTimingFunction: cbTiming,
    display: 'inline-block',
    height: 'auto',
    margin: '0 .5rem',
    width: '2rem'
  },

  pato0: {
    animationDelay: '200ms'
  },

  pato1: {
    animationDelay: '500ms'
  },

  pato2: {
    animationDelay: '800ms'
  },

  message: {
    color: ui.hintColor,
    fontSize: appTheme.typography.sBase,
    fontWeight: 400,
    margin: '.5rem 0 0'
  }
})

export default withStyles(styleThunk)(LoadingView)

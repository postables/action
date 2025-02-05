import {
  DEFAULT_MENU_HEIGHT,
  DEFAULT_MENU_WIDTH,
  HUMAN_ADDICTION_THRESH,
  MAX_WAIT_TIME
} from '../styles/ui'
import Loadable from 'react-loadable'
import LoadableLoading from './LoadableLoading'
import React from 'react'

const UpgradeModalLoadable = Loadable({
  loader: () =>
    import(
      /* webpackChunkName: 'UpdateCreditCard' */
      './UpdateCreditCard'
    ),
  loading: (props) => (
    <LoadableLoading {...props} height={DEFAULT_MENU_HEIGHT} width={DEFAULT_MENU_WIDTH} />
  ),
  delay: HUMAN_ADDICTION_THRESH,
  timeout: MAX_WAIT_TIME
})

export default UpgradeModalLoadable

import PropTypes from 'prop-types'
import React from 'react'
import withAtmosphere from '../decorators/withAtmosphere/withAtmosphere'
import {cacheConfig} from '../utils/constants'
import QueryRenderer from './QueryRenderer/QueryRenderer'
import {
  DEFAULT_MENU_HEIGHT,
  DEFAULT_MENU_WIDTH,
  HUMAN_ADDICTION_THRESH,
  MAX_WAIT_TIME
} from '../styles/ui'
import Loadable from 'react-loadable'
import LoadableLoading from './LoadableLoading'
import graphql from 'babel-plugin-relay/macro'
import RelayLoadableTransitionGroup from './RelayLoadableTransitionGroup'

const query = graphql`
  query SuggestMentionableUsersRootQuery($teamId: ID!) {
    viewer {
      ...SuggestMentionableUsers_viewer
    }
  }
`

const loading = (props) => (
  <LoadableLoading {...props} height={DEFAULT_MENU_HEIGHT} width={DEFAULT_MENU_WIDTH} />
)
const LoadableSuggestMentionableUsers = Loadable({
  loader: () =>
    import(
      /* webpackChunkName: 'SuggestMentionableUsers' */
      '../../client/components/SuggestMentionableUsers'
    ),
  loading,
  delay: HUMAN_ADDICTION_THRESH,
  timeout: MAX_WAIT_TIME
})

const SuggestMentionableUsersRoot = (props) => {
  const {
    activeIdx,
    atmosphere,
    handleSelect,
    setSuggestions,
    suggestions,
    triggerWord,
    teamId
  } = props
  return (
    <QueryRenderer
      cacheConfig={cacheConfig}
      environment={atmosphere}
      query={query}
      variables={{teamId}}
      render={(readyState) => (
        <RelayLoadableTransitionGroup
          LoadableComponent={LoadableSuggestMentionableUsers}
          loading={loading}
          readyState={readyState}
          extraProps={{
            activeIdx,
            handleSelect,
            setSuggestions,
            suggestions,
            triggerWord
          }}
        />
      )}
    />
  )
}

SuggestMentionableUsersRoot.propTypes = {
  activeIdx: PropTypes.number.isRequired,
  atmosphere: PropTypes.object.isRequired,
  handleSelect: PropTypes.func.isRequired,
  setSuggestions: PropTypes.func.isRequired,
  suggestions: PropTypes.array,
  triggerWord: PropTypes.string.isRequired,
  teamId: PropTypes.string.isRequired
}

export default withAtmosphere(SuggestMentionableUsersRoot)

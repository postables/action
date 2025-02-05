import {ProviderList_viewer} from '../../../../__generated__/ProviderList_viewer.graphql'
import React from 'react'
import styled from '@emotion/styled'
import {createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import SettingsWrapper from '../../../../components/Settings/SettingsWrapper'
import AtlassianProviderRow from '../ProviderRow/AtlassianProviderRow'
import GitHubProviderRow from '../ProviderRow/GitHubProviderRow'
import SlackProviderRow from '../ProviderRow/SlackProviderRow'

interface Props {
  viewer: ProviderList_viewer
  teamId: string
  retry: () => void
}

const StyledWrapper = styled(SettingsWrapper)({
  paddingBottom: 8,
  paddingTop: 8
})

const ProviderList = (props: Props) => {
  const {viewer, retry, teamId} = props
  return (
    <StyledWrapper>
      <AtlassianProviderRow teamId={teamId} retry={retry} viewer={viewer} />
      <GitHubProviderRow teamId={teamId} viewer={viewer} />
      <SlackProviderRow teamId={teamId} viewer={viewer} />
    </StyledWrapper>
  )
}

export default createFragmentContainer(ProviderList, {
  viewer: graphql`
    fragment ProviderList_viewer on User {
      ...AtlassianProviderRow_viewer
      ...GitHubProviderRow_viewer
      ...SlackProviderRow_viewer
    }
  `
})

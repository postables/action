import React from 'react'
import graphql from 'babel-plugin-relay/macro'
import {RouteComponentProps} from 'react-router'
import QueryRenderer from './QueryRenderer/QueryRenderer'
import {LoaderSize} from '../types/constEnums'
import renderQuery from '../utils/relay/renderQuery'
import useAtmosphere from '../hooks/useAtmosphere'
import ViewerNotOnTeam from './ViewerNotOnTeam'
import NotificationSubscription from '../subscriptions/NotificationSubscription'

const query = graphql`
  query ViewerNotOnTeamRootQuery($teamId: ID!) {
    viewer {
      ...ViewerNotOnTeam_viewer
    }
  }
`

interface Props extends RouteComponentProps<{teamId: string}> {}

const subscriptions = [NotificationSubscription]
const ViewerNotOnTeamRoot = (props: Props) => {
  const {match} = props
  const {params} = match
  const {teamId} = params
  const atmosphere = useAtmosphere()
  return (
    <QueryRenderer
      environment={atmosphere}
      query={query}
      variables={{teamId}}
      subscriptions={subscriptions}
      render={renderQuery(ViewerNotOnTeam, {size: LoaderSize.WHOLE_PAGE, props: {teamId}})}
    />
  )
}

export default ViewerNotOnTeamRoot

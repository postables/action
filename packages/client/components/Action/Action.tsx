import React, {lazy, memo, Suspense} from 'react'
import styled from '@emotion/styled'
import {Route, Switch} from 'react-router'
import AnalyticsPageRoot from '../AnalyticsPageRoot'
import SocketHealthMonitor from '../SocketHealthMonitor'
import {CREATE_ACCOUNT_SLUG, SIGNIN_SLUG} from '../../utils/constants'
import {PALETTE} from '../../styles/paletteV2'
import {LoaderSize} from '../../types/constEnums'
import ErrorBoundary from '../ErrorBoundary'
import LoadingComponent from '../LoadingComponent/LoadingComponent'
import PrivateRoutes from '../PrivateRoutes'
import {DragDropContext as dragDropContext} from 'react-dnd'
import HTML5Backend from 'react-dnd-html5-backend'
import Snackbar from '../Snackbar'

const AuthenticationPage = lazy(() =>
  import(/* webpackChunkName: 'AuthenticationPage' */ '../AuthenticationPage')
)
const DemoMeeting = lazy(() =>
  import(/* webpackChunkName: 'DemoMeeting' */ '../DemoMeeting')
)
const DemoSummary = lazy(() =>
  import(/* webpackChunkName: 'DemoSummary' */ '../DemoSummary')
)
const AuthProvider = lazy(() =>
  import(/* webpackChunkName: 'AuthProvider' */ '../AuthProvider')
)
const OauthRedirect = lazy(() =>
  import(/* webpackChunkName: 'GoogleOAuthProvider' */ '../OAuthRedirect')
)
const TeamInvitation = lazy(() =>
  import(/* webpackChunkName: 'TeamInvitationRoot' */ '../TeamInvitationRoot')
)
const InvitationLink = lazy(() =>
  import(/* webpackChunkName: 'InvitationLinkRoot' */ '../InvitationLinkRoot')
)

const ActionStyles = styled('div')({
  // bg is important since we do a slide up animation we don't want the background to slide up, too
  background: PALETTE.BACKGROUND_MAIN,
  margin: 0,
  minHeight: '100vh',
  padding: 0,
  width: '100%'
})

const Action = memo(() => {
  return (
    <ActionStyles>
      <ErrorBoundary>
        <Snackbar />
        <SocketHealthMonitor />
        <AnalyticsPageRoot />
        <Suspense fallback={<LoadingComponent spinnerSize={LoaderSize.WHOLE_PAGE} />}>
          <Switch>
            <Route exact path='/' render={(p) => <AuthenticationPage {...p} page={'signin'} />} />
            <Route
              exact
              path={`/${SIGNIN_SLUG}`}
              render={(p) => <AuthenticationPage {...p} page={'signin'} />}
            />
            <Route
              exact
              path={`/${CREATE_ACCOUNT_SLUG}`}
              render={(p) => <AuthenticationPage {...p} page={'create-account'} />}
            />
            <Route exact path={`/auth/:provider`} component={AuthProvider} />
            <Route exact path={`/oauth-redirect`} component={OauthRedirect} />
            <Route
              path='/retrospective-demo/:localPhaseSlug?/:stageIdxSlug?'
              component={DemoMeeting}
            />
            <Route path='/retrospective-demo-summary' component={DemoSummary} />
            <Route
              exact
              path={`/reset-password`}
              render={(p) => <AuthenticationPage {...p} page={'reset-password'} />}
            />
            {/*Legacy route, still referenced by old invite emails*/}
            <Route path='/invitation/:inviteToken' component={TeamInvitation} />
            <Route path='/team-invitation/:token' component={TeamInvitation} />
            <Route path='/invitation-link/:token' component={InvitationLink} />
            <Route component={PrivateRoutes} />
          </Switch>
        </Suspense>
      </ErrorBoundary>
    </ActionStyles>
  )
})

export default dragDropContext(HTML5Backend)(Action)

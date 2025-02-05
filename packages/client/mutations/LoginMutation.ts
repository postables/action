import {
  LoginMutation as TLoginMutation,
  LoginMutationVariables
} from '../__generated__/LoginMutation.graphql'
import {commitMutation} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import {Disposable} from 'relay-runtime'
import SendClientSegmentEventMutation from './SendClientSegmentEventMutation'
import {SegmentClientEventEnum} from '../types/graphql'
import getGraphQLError from '../utils/relay/getGraphQLError'
import {Omit} from '../types/generics'
import {LocalHandlers} from '../types/relayMutations'
import {meetingTypeToSlug} from '../utils/meetings/lookups'
import getValidRedirectParam from '../utils/getValidRedirectParam'

const mutation = graphql`
  mutation LoginMutation(
    $auth0Token: String!
    $invitationToken: ID
    $segmentId: ID
    $isOrganic: Boolean!
  ) {
    login(auth0Token: $auth0Token, segmentId: $segmentId, isOrganic: $isOrganic) {
      error {
        message
      }
      authToken
      user {
        tms
        ...UserAnalyticsFrag @relay(mask: false)
      }
    }
    acceptTeamInvitation(invitationToken: $invitationToken) {
      authToken
      team {
        id
        newMeeting {
          meetingType
        }
      }
    }
  }
`
const LoginMutation = (
  atmosphere: any,
  variables: Omit<LoginMutationVariables, 'isOrganic'>,
  {onCompleted, history}: LocalHandlers
): Disposable => {
  atmosphere.setAuthToken(variables.auth0Token)
  return commitMutation<TLoginMutation>(atmosphere, {
    mutation,
    variables: {...variables, isOrganic: !variables.invitationToken},
    onCompleted: (res, errors) => {
      onCompleted && onCompleted(res, errors)
      const serverError = getGraphQLError(res, errors)
      if (serverError) {
        console.error(serverError.message)
        atmosphere.setAuthToken(null)
        history && history.push(`/?error=${serverError.message}`)
        return
      }
      const {acceptTeamInvitation, login} = res
      const authToken = acceptTeamInvitation.authToken || login.authToken
      atmosphere.setAuthToken(authToken)
      SendClientSegmentEventMutation(atmosphere, SegmentClientEventEnum.UserLogin)

      if (!history) return
      const {team} = acceptTeamInvitation
      // redirect directly into meeting
      if (team) {
        const {newMeeting, id: teamId} = team
        if (newMeeting) {
          const {meetingType} = newMeeting
          const slug = meetingTypeToSlug[meetingType]
          history.push(`/${slug}/${teamId}`)
        } else {
          history.push(`/team/${teamId}`)
        }
        return
      }

      // standard redirect logic
      const nextUrl = getValidRedirectParam() || '/me'
      history.push(nextUrl)
    },
    onError: (err) => {
      console.error('Error logging in', err)
    }
  })
}

export default LoginMutation

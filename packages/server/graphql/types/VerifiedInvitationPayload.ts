import {GraphQLString, GraphQLID, GraphQLBoolean, GraphQLObjectType} from 'graphql'
import TeamInvitation from './TeamInvitation'
import {resolveUser} from '../resolvers'
import User from './User'
import TeamInvitationErrorEnum from './TeamInvitationErrorEnum'
import MeetingTypeEnum from './MeetingTypeEnum'

const VerifiedInvitationPayload = new GraphQLObjectType({
  name: 'VerifiedInvitationPayload',
  fields: () => ({
    errorType: {
      type: TeamInvitationErrorEnum
    },
    inviterName: {
      type: GraphQLString,
      description:
        'The name of the person that sent the invitation, present if errorType is expired'
    },
    inviterEmail: {
      type: GraphQLString,
      description:
        'The email of the person that send the invitation, present if errorType is expired'
    },
    isGoogle: {
      type: GraphQLBoolean,
      description: 'true if the mx record is hosted by google, else falsy'
    },
    teamInvitation: {
      type: TeamInvitation,
      description: 'The valid invitation, if any'
    },
    teamName: {
      type: GraphQLString,
      description: 'name of the inviting team, present if invitation exists'
    },
    meetingType: {
      type: MeetingTypeEnum
    },
    userId: {
      type: GraphQLID,
      description: 'The userId of the invitee, if already a parabol user'
    },
    user: {
      type: User,
      description: 'The invitee, if already a parabol user, present if errorType is null',
      resolve: resolveUser
    }
  })
})

export default VerifiedInvitationPayload

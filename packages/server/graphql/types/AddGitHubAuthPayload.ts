import {GraphQLObjectType} from 'graphql'
import getRethink from '../../database/rethinkDriver'
import StandardMutationError from './StandardMutationError'
import {GITHUB} from '../../../client/utils/constants'
import GitHubAuth from './GitHubAuth'
import User from './User'

const AddGitHubAuthPayload = new GraphQLObjectType({
  name: 'AddGitHubAuthPayload',
  fields: () => ({
    error: {
      type: StandardMutationError
    },
    githubAuth: {
      type: GitHubAuth,
      description: 'The newly created auth',
      resolve: async ({teamId, userId}) => {
        const r = getRethink()
        return r
          .table('Provider')
          .getAll(teamId, {index: 'teamId'})
          .filter({service: GITHUB, isActive: true, userId})
          .nth(0)
          .default(null)
      }
    },
    user: {
      type: User,
      description: 'The user with updated githubAuth',
      resolve: ({userId}, _args, {dataLoader}) => {
        return dataLoader.get('users').load(userId)
      }
    }
  })
})

export default AddGitHubAuthPayload

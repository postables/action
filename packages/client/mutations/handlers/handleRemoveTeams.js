import pluralizeHandler from './pluralizeHandler'
import safeRemoveNodeFromArray from '../../utils/relay/safeRemoveNodeFromArray'

const handleRemoveTeam = (teamId, store, viewerId) => {
  const viewer = store.get(viewerId)
  safeRemoveNodeFromArray(teamId, viewer, 'teams')
}

const handleRemoveTeams = pluralizeHandler(handleRemoveTeam)
export default handleRemoveTeams

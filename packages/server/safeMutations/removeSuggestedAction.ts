import getRethink from '../database/rethinkDriver'

const removeSuggestedAction = (userId: string, type: string) => {
  const r = getRethink()
  return r
    .table('SuggestedAction')
    .getAll(userId, {index: 'userId'})
    .filter({removedAt: null, type})
    .update({removedAt: new Date()}, {returnChanges: true})('changes')(0)('new_val')('id')
    .default(null)
}
export default removeSuggestedAction

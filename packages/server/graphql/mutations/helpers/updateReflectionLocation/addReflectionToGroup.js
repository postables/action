import makeRetroGroupTitle from '../../../../../client/utils/autogroup/makeRetroGroupTitle'
import getRethink from '../../../../database/rethinkDriver'
import updateGroupTitle from './updateGroupTitle'
import dndNoise from '../../../../../client/utils/dndNoise'
import standardError from '../../../../utils/standardError'
import {getUserId} from '../../../../utils/authorization'

const addReflectionToGroup = async (reflectionId, reflectionGroupId, {authToken, dataLoader}) => {
  const r = getRethink()
  const now = new Date()
  const viewerId = getUserId(authToken)
  const reflection = await dataLoader.get('retroReflections').load(reflectionId)
  if (!reflection) return standardError(new Error('Reflection not found'), {userId: viewerId})
  const {reflectionGroupId: oldReflectionGroupId, meetingId: reflectionMeetingId} = reflection
  const reflectionGroup = await r.table('RetroReflectionGroup').get(reflectionGroupId)
  if (!reflectionGroup || !reflectionGroup.isActive) {
    return standardError(new Error('Reflection group not found'), {userId: viewerId})
  }
  const {meetingId} = reflectionGroup
  if (reflectionMeetingId !== meetingId) {
    return standardError(new Error('Reflection group not found'), {userId: viewerId})
  }
  const maxSortOrder = await r
    .table('RetroReflection')
    .getAll(reflectionGroupId, {index: 'reflectionGroupId'})('sortOrder')
    .max()

  // RESOLUTION
  await r
    .table('RetroReflection')
    .get(reflectionId)
    .update({
      sortOrder: maxSortOrder + 1 + dndNoise(),
      reflectionGroupId,
      updatedAt: now
    })

  // mutate the dataLoader cache
  reflection.reflectionGroupId = reflectionGroupId
  reflection.updatedAt = now

  if (oldReflectionGroupId !== reflectionGroupId) {
    // ths is not just a reorder within the same group
    const {nextReflections, oldReflections} = await r({
      nextReflections: r
        .table('RetroReflection')
        .getAll(reflectionGroupId, {index: 'reflectionGroupId'})
        .filter({isActive: true})
        .coerceTo('array'),
      oldReflections: r
        .table('RetroReflection')
        .getAll(oldReflectionGroupId, {index: 'reflectionGroupId'})
        .filter({isActive: true})
        .coerceTo('array')
    })

    const {smartTitle: nextGroupSmartTitle, title: nextGroupTitle} = makeRetroGroupTitle(
      nextReflections
    )
    await updateGroupTitle(reflectionGroupId, nextGroupSmartTitle, nextGroupTitle)

    if (oldReflections.length > 0) {
      const {smartTitle: oldGroupSmartTitle, title: oldGroupTitle} = makeRetroGroupTitle(
        oldReflections
      )
      await updateGroupTitle(oldReflectionGroupId, oldGroupSmartTitle, oldGroupTitle)
    } else {
      await r
        .table('RetroReflectionGroup')
        .get(oldReflectionGroupId)
        .update({
          isActive: false,
          updatedAt: now
        })
    }
  }
  return reflectionGroupId
}

export default addReflectionToGroup

import shortid from 'shortid'
import {DISCUSS} from '../../../../client/utils/constants'
import makeDiscussionStage from '../../../../client/utils/makeDiscussionStage'
import mapGroupsToStages from '../../../../client/utils/makeGroupsToStages'

const addDiscussionTopics = async (meeting, dataLoader) => {
  const {id: meetingId, phases} = meeting
  const discussPhase = phases.find((phase) => phase.phaseType === DISCUSS)
  if (!discussPhase) return {}
  const placeholderStage = discussPhase.stages[0]
  const reflectionGroups = await dataLoader.get('retroReflectionGroupsByMeetingId').load(meetingId)
  const importantReflectionGroups = mapGroupsToStages(reflectionGroups)
  const nextDiscussStages = importantReflectionGroups.map((reflectionGroup, idx) => {
    const id = idx === 0 ? placeholderStage.id : shortid.generate()
    return makeDiscussionStage(reflectionGroup.id, meetingId, idx, id)
  })
  const firstDiscussStage = nextDiscussStages[0]
  if (!firstDiscussStage || !placeholderStage) return {}

  // MUTATIVE
  discussPhase.stages = nextDiscussStages
  return {meetingId, discussPhaseStages: nextDiscussStages}
}

export default addDiscussionTopics

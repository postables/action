import {INewMeetingPhase, NewMeetingPhaseTypeEnum} from '../types/graphql'

const unlockAllStagesForPhase = (
  phases: INewMeetingPhase[],
  phaseType: NewMeetingPhaseTypeEnum,
  isForFacilitator: boolean,
  isUnlock = true
) => {
  const field = isForFacilitator ? 'isNavigableByFacilitator' : 'isNavigable'
  const phase = phases.find((p) => p.phaseType === phaseType)
  if (!phase) return []
  const {stages} = phase
  // mutates the phase object
  stages.forEach((stage) => {
    stage[field] = isUnlock
  })
  return stages.map(({id}) => id)
}

export default unlockAllStagesForPhase

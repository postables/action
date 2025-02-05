import {AGENDA_ITEMS} from '../../../../client/utils/constants'
import getRethink from '../../../database/rethinkDriver'
import {DataLoaderWorker} from '../../graphql'
import Meeting from '../../../database/types/Meeting'
import AgendaItemsPhase from '../../../database/types/AgendaItemsPhase'
import AgendaItemsStage from '../../../database/types/AgendaItemsStage'

/*
 * NewMeetings have a predefined set of stages, we need to add the new agenda item manually
 */
const addAgendaItemToNewMeeting = async (
  agendaItemId,
  teamId: string,
  dataLoader: DataLoaderWorker
) => {
  const now = new Date()
  const r = getRethink()
  const team = await dataLoader.get('teams').load(teamId)
  const {meetingId} = team
  if (!meetingId) return undefined
  // make sure it's a new meeting
  const newMeeting = (await r
    .table('NewMeeting')
    .get(meetingId)
    .default(null)) as Meeting
  if (!newMeeting) return undefined
  const {phases} = newMeeting
  const agendaItemPhase = phases.find((phase) => phase.phaseType === AGENDA_ITEMS) as
    | AgendaItemsPhase
    | undefined
  if (!agendaItemPhase) return undefined

  const {stages} = agendaItemPhase
  const newStage = new AgendaItemsStage(agendaItemId)
  newStage.isNavigable = true
  newStage.isNavigableByFacilitator = true
  stages.push(newStage)
  await r
    .table('NewMeeting')
    .get(meetingId)
    .update({
      phases,
      updatedAt: now
    })
  return meetingId
}

export default addAgendaItemToNewMeeting

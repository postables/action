import {RETROSPECTIVE} from '../../../client/utils/constants'

exports.up = async (r) => {
  try {
    await r.tableCreate('MeetingMember')
  } catch (e) {
    // noop
  }
  try {
    await Promise.all([
      r.table('MeetingMember').indexCreate('meetingId'),
      r.table('MeetingMember').indexCreate('teamId'),
      r.table('MeetingMember').indexCreate('userId')
    ])
  } catch (e) {
    // noop
  }
  try {
    await r
      .table('MeetingSettings')
      .filter({meetingType: RETROSPECTIVE})
      .update({
        totalVotes: 5,
        maxVotesPerGroup: 3
      })
  } catch (e) {
    // noop
  }
}

exports.down = async (r) => {
  try {
    await r
      .table('MeetingSettings')
      .filter({meetingType: RETROSPECTIVE})
      .replace((settings) => settings.without('totalVotes', 'maxVotesPerGroup'))
  } catch (e) {
    // noop
  }
  try {
    await r.tableDrop('MeetingMember')
  } catch (e) {
    // noop
  }
}

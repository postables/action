exports.up = async (r) => {
  try {
    await r.table('Team').replace((row) => {
      return row.without(
        'activeFacilitator',
        'facilitatorPhase',
        'facilitatorPhaseItem',
        'meetingPhase',
        'meetingPhaseItem'
      )
    })
  } catch (e) {
    console.log(e)
  }
}

exports.down = async () => {
  /* noop */
}

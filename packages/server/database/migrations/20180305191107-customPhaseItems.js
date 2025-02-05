import {LOBBY, SUMMARY} from '../../../client/utils/constants'

exports.up = async (r) => {
  try {
    await r
      .table('CustomPhaseItem')
      .filter({
        title: 'Change'
      })
      .delete()
  } catch (e) {
    // noop
  }

  try {
    await r.table('CustomPhaseItem').replace((customPhaseItem) => {
      return customPhaseItem
        .merge({
          phaseItemType: customPhaseItem('type')
        })
        .without('type')
    })
  } catch (e) {
    // noop
  }

  try {
    await r.table('MeetingSettings').replace((settings) => {
      return settings
        .merge({
          phaseTypes: settings('phases').difference([LOBBY, SUMMARY])
        })
        .without('phases')
    })
  } catch (e) {
    // noop
  }
}

exports.down = async (r) => {
  // DOES NOT REPLACE REMOVED "CHANGED" CATEGORY BECAUSE A NEW ID WOULD CAUSE SADNESS
  try {
    await r.table('CustomPhaseItem').replace((customPhaseItem) => {
      return customPhaseItem
        .merge({
          type: customPhaseItem('type')
        })
        .without('phaseItemType')
    })
  } catch (e) {
    // noop
  }
  try {
    await r.table('MeetingSettings').replace((settings) => {
      return (
        settings
          // don't add lobby & summary back in, we don't know where they go
          .merge({
            phases: settings('phaseTypes')
          })
          .without('phaseTypes')
      )
    })
  } catch (e) {
    // noop
  }
}

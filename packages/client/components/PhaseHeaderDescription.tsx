import styled from '@emotion/styled'
import {PALETTE} from '../styles/paletteV2'
import {meetingTopBarMediaQuery} from '../styles/meeting'

const PhaseHeaderDescription = styled('h2')({
  color: PALETTE.TEXT_LIGHT,
  display: 'none',
  fontWeight: 'normal',
  margin: 0,

  [meetingTopBarMediaQuery]: {
    display: 'block',
    fontSize: '.875rem'
  }
})

export default PhaseHeaderDescription

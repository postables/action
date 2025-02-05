import {createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import DashNavItem from './DashNavItem'
import React from 'react'
import appTheme from '../../styles/theme/appTheme'
import styled from '@emotion/styled'
import Icon from '../Icon'
import {MD_ICONS_SIZE_18} from '../../styles/icons'
import {DashNavTeam_team} from '../../__generated__/DashNavTeam_team.graphql'

const WarningIcon = styled(Icon)({
  color: appTheme.palette.light,
  fontSize: MD_ICONS_SIZE_18,
  position: 'absolute',
  left: '.625rem'
})

const IconAndLink = styled('div')({
  alignItems: 'center',
  display: 'flex',
  position: 'relative'
})

interface Props {
  team: DashNavTeam_team
  onClick: () => void
}

const DashNavTeam = (props: Props) => {
  const {onClick, team} = props
  return (
    <IconAndLink>
      {!team.isPaid && <WarningIcon title='Team is disabled for nonpayment'>warning</WarningIcon>}
      <DashNavItem href={`/team/${team.id}`} label={team.name} icon={'group'} onClick={onClick} />
    </IconAndLink>
  )
}

export default createFragmentContainer(DashNavTeam, {
  team: graphql`
    fragment DashNavTeam_team on Team {
      id
      isPaid
      name
    }
  `
})

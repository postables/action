import React, {ReactNode} from 'react'
import styled from '@emotion/styled'
import appTheme from '../styles/theme/appTheme'
import ui from '../styles/ui'
import {phaseLabelLookup} from '../utils/meetings/lookups'

const NavListItem = styled('li')({
  fontWeight: 600,
  lineHeight: '2.5rem',
  display: 'flex',
  flexDirection: 'column'
})

const NavItemBullet = styled('span')<{isFacilitatorPhaseGroup: boolean}>(
  {
    backgroundColor: appTheme.palette.mid,
    borderRadius: '100%',
    color: ui.palette.white,
    display: 'inline-block',
    fontSize: '.6875rem',
    fontWeight: 600,
    height: '1.5rem',
    lineHeight: '1.5rem',
    marginLeft: '1.3125rem',
    marginRight: '.75rem',
    textAlign: 'center',
    verticalAlign: 'middle',
    width: '1.5rem'
  },
  ({isFacilitatorPhaseGroup}) => ({
    backgroundImage: isFacilitatorPhaseGroup && ui.gradientWarm
  })
)

const NavItemLabel = styled('span')({
  display: 'inline-block',
  fontSize: ui.navMenuFontSize,
  verticalAlign: 'middle'
})

const navListItemLinkActive = {
  backgroundColor: ui.navMenuLightBackgroundColorActive,
  borderLeftColor: ui.palette.mid,
  color: appTheme.palette.dark,
  ':hover,:focus': {
    backgroundColor: ui.navMenuLightBackgroundColorActive
  }
}

const navListItemLinkDisabled = {
  cursor: 'not-allowed',
  ':hover,:focus': {
    backgroundColor: 'transparent'
  }
}

interface LinkProps {
  isDisabled: boolean
  isActive: boolean
}

const NavListItemLink = styled('div')<LinkProps>(
  {
    borderLeft: `${ui.navMenuLeftBorderWidth} solid transparent`,
    color: ui.colorText,
    cursor: 'pointer',
    textDecoration: 'none',
    userSelect: 'none',
    ':hover,:focus': {
      backgroundColor: ui.navMenuLightBackgroundColorHover
    }
  },
  ({isDisabled}) => isDisabled && navListItemLinkDisabled,
  ({isActive}) => isActive && navListItemLinkActive
)

interface Props {
  children: ReactNode
  handleClick?: () => void
  phaseType: string
  listPrefix: string
  isActive: boolean
  isFacilitatorPhaseGroup: boolean
}

const NewMeetingSidebarPhaseListItem = (props: Props) => {
  const {children, handleClick, phaseType, listPrefix, isActive, isFacilitatorPhaseGroup} = props
  const label = phaseLabelLookup[phaseType]
  return (
    <NavListItem>
      <NavListItemLink
        isDisabled={!handleClick}
        isActive={isActive}
        onClick={handleClick}
        title={label}
      >
        <NavItemBullet isFacilitatorPhaseGroup={isFacilitatorPhaseGroup}>
          {listPrefix}
        </NavItemBullet>
        <NavItemLabel>{label}</NavItemLabel>
      </NavListItemLink>
      {children}
    </NavListItem>
  )
}

export default NewMeetingSidebarPhaseListItem

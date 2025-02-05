import {DashSidebar_viewer} from '../../__generated__/DashSidebar_viewer.graphql'
import React from 'react'
import styled from '@emotion/styled'
import {createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import {NavLink} from 'react-router-dom'
import tinycolor from 'tinycolor2'
import DashNavList from '../DashNavList/DashNavList'
import Icon from '../Icon'
import LogoBlock from '../LogoBlock/LogoBlock'
import StandardHub from '../StandardHub/StandardHub'
import makeHoverFocus from '../../styles/helpers/makeHoverFocus'
import {MD_ICONS_SIZE_18} from '../../styles/icons'
import appTheme from '../../styles/theme/appTheme'
import ui from '../../styles/ui'
import DashNavItem from './DashNavItem'
import {ClassNames} from '@emotion/core'

export const enum DASH_SIDEBAR {
  BREAKPOINT = 800,
  WIDTH = 240
}

interface Props {
  handleMenuClick: () => void
  viewer: DashSidebar_viewer | null
}

const textColor = tinycolor.mix(appTheme.palette.mid10l, '#fff', 50).toHexString()
const linkBaseStyles = {
  color: textColor,
  textDecoration: 'none'
}

const DashSidebarStyles = styled('div')({
  backgroundColor: ui.dashSidebarBackgroundColor,
  color: textColor,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  maxWidth: DASH_SIDEBAR.WIDTH,
  minWidth: DASH_SIDEBAR.WIDTH,
  overflow: 'hidden',
  userSelect: 'none'
})

const MyDashboard = styled('div')({
  borderBottom: ui.dashMenuBorder,
  marginBottom: '1rem'
})

const NavBlock = styled('div')({
  flex: 1,
  position: 'relative'
})

const Nav = styled('nav')({
  display: 'flex',
  flexDirection: 'column',
  left: 0,
  maxHeight: '100%',
  paddingBottom: '1.25rem',
  position: 'absolute',
  top: 0,
  width: '100%'
})

const NavMain = styled('div')({
  flex: 1,
  overflowY: 'auto'
})

const NavLabel = styled('div')({
  color: 'rgba(255, 255, 255, .5)',
  cursor: 'default',
  fontSize: appTheme.typography.s1,
  fontWeight: 600,
  marginLeft: '2.1875rem',
  padding: '1.25rem 0',
  textTransform: 'uppercase'
})

const addTeamStyles = {
  ...linkBaseStyles,
  alignItems: 'center',
  borderLeft: `${ui.navMenuLeftBorderWidth} solid transparent`,
  cursor: 'pointer',
  display: 'flex',
  margin: '.75rem 0 0',
  opacity: '.65',
  padding: '.625rem .5rem .625rem 2rem',
  position: 'relative',
  transition: `opacity 100ms ease-in`,
  userSelect: 'none',

  ...makeHoverFocus({
    ...linkBaseStyles,
    backgroundColor: ui.navMenuDarkBackgroundColorHover,
    opacity: 1
  })
}

const disabledAddTeamStyles = {
  backgroundColor: ui.navMenuDarkBackgroundColorActive,
  cursor: 'default',
  opacity: 1,

  ...makeHoverFocus({
    backgroundColor: ui.navMenuDarkBackgroundColorActive,
    opacity: 1
  })
}

const AddTeamIcon = styled(Icon)({
  fontSize: MD_ICONS_SIZE_18,
  marginRight: '.5rem'
})

const AddTeamLabel = styled('div')({
  fontSize: ui.navMenuFontSize,
  lineHeight: ui.navMenuLineHeight
})

const DashSidebar = (props: Props) => {
  const {handleMenuClick, viewer} = props
  return (
    <DashSidebarStyles>
      <StandardHub handleMenuClick={handleMenuClick} viewer={viewer} />
      <NavBlock>
        <Nav>
          {/* use div for flex layout */}
          <div>
            <MyDashboard>
              <DashNavItem
                href='/me'
                icon='dashboard'
                label='My Dashboard'
                onClick={handleMenuClick}
              />
            </MyDashboard>
            <NavLabel>{'My Teams'}</NavLabel>
          </div>
          <NavMain>
            <DashNavList viewer={viewer} onClick={handleMenuClick} />
          </NavMain>
          <ClassNames>
            {({css}) => {
              return (
                <NavLink
                  onClick={handleMenuClick}
                  className={css(addTeamStyles)}
                  activeClassName={css(disabledAddTeamStyles)}
                  title='Add New Team'
                  to='/newteam/1'
                >
                  <AddTeamIcon>add_circle</AddTeamIcon>
                  <AddTeamLabel>{'Add New Team'}</AddTeamLabel>
                </NavLink>
              )
            }}
          </ClassNames>
        </Nav>
      </NavBlock>
      <LogoBlock variant='white' onClick={handleMenuClick} />
    </DashSidebarStyles>
  )
}

export default createFragmentContainer(DashSidebar, {
  viewer: graphql`
    fragment DashSidebar_viewer on User {
      ...StandardHub_viewer
      ...DashNavList_viewer
    }
  `
})

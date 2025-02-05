import {AtlassianProviderRow_viewer} from '../../../../__generated__/AtlassianProviderRow_viewer.graphql'
import jwtDecode from 'jwt-decode'
import React, {useEffect} from 'react'
import styled from '@emotion/styled';
import {createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import {RouteComponentProps, withRouter} from 'react-router-dom'
import FlatButton from '../../../../components/FlatButton'
import Icon from '../../../../components/Icon'
import AtlassianConfigMenu from '../../../../components/AtlassianConfigMenu'
import LoadingComponent from '../../../../components/LoadingComponent/LoadingComponent'
import ProviderCard from '../../../../components/ProviderCard'
import ProviderActions from '../../../../components/ProviderActions'
import RowInfo from '../../../../components/Row/RowInfo'
import RowInfoCopy from '../../../../components/Row/RowInfoCopy'
import withAtmosphere, {
  WithAtmosphereProps
} from '../../../../decorators/withAtmosphere/withAtmosphere'
import useAtlassianSites from '../../../../hooks/useAtlassianSites'
import {MenuPosition} from '../../../../hooks/useCoords'
import useMenu from '../../../../hooks/useMenu'
import {DECELERATE, fadeIn} from '../../../../styles/animation'
import {PALETTE} from '../../../../styles/paletteV2'
import {ICON_SIZE} from '../../../../styles/typographyV2'
import {Providers} from '../../../../types/constEnums'
import {IAuthToken} from '../../../../types/graphql'
import withMutationProps, {WithMutationProps} from '../../../../utils/relay/withMutationProps'
import AtlassianProviderLogo from '../../../../AtlassianProviderLogo'
import {MenuMutationProps} from '../../../../hooks/useMutationProps'
import AtlassianClientManager from '../../../../utils/AtlassianClientManager'
import {DASH_SIDEBAR} from '../../../../components/Dashboard/DashSidebar'
import useBreakpoint from '../../../../hooks/useBreakpoint'

const StyledButton = styled(FlatButton)({
  borderColor: PALETTE.BORDER_LIGHT,
  color: PALETTE.TEXT_MAIN,
  fontSize: 14,
  fontWeight: 600,
  minWidth: 36,
  paddingLeft: 0,
  paddingRight: 0,
  width: '100%'
})

interface Props extends WithAtmosphereProps, WithMutationProps, RouteComponentProps<{}> {
  teamId: string
  retry: () => void
  viewer: AtlassianProviderRow_viewer
}

const useFreshToken = (accessToken: string | undefined, retry: () => void) => {
  useEffect(() => {
    if (!accessToken) return
    const decodedToken = jwtDecode(accessToken) as IAuthToken | null
    const delay = (decodedToken && decodedToken.exp * 1000 - Date.now()) || -1
    if (delay <= 0) return
    const cancel = window.setTimeout(() => {
      retry()
    }, delay)
    return () => {
      window.clearTimeout(cancel)
    }
  }, [accessToken, retry])
}

const MenuButton = styled(FlatButton)({
  color: PALETTE.PRIMARY_MAIN,
  fontSize: ICON_SIZE.MD18,
  height: 24,
  userSelect: 'none',
  marginLeft: 4,
  padding: 0,
  width: 24
})

const StyledIcon = styled(Icon)({
  fontSize: ICON_SIZE.MD18
})

const ListAndMenu = styled('div')({
  display: 'flex',
  position: 'absolute',
  right: 16,
  top: 16
})

const SiteList = styled('div')({})

const SiteAvatar = styled('img')<{idx: number}>(({idx}) => ({
  animationName: fadeIn.toString(),
  animationDuration: '300ms',
  animationTimingFunction: DECELERATE,
  animationDelay: `${idx * 100}ms`,
  animationIterationCount: 1,
  borderRadius: '100%',
  marginLeft: 8,
  opacity: 0
}))

const ProviderName = styled('div')({
  color: PALETTE.TEXT_MAIN,
  fontSize: 18,
  lineHeight: '24px',
  alignItems: 'center',
  display: 'flex',
  marginRight: 16,
  verticalAlign: 'middle'
})

const AtlassianProviderRow = (props: Props) => {
  const {
    atmosphere,
    retry,
    viewer,
    teamId,
    submitting,
    submitMutation,
    onError,
    onCompleted
  } = props
  const mutationProps = {submitting, submitMutation, onError, onCompleted} as MenuMutationProps
  const {atlassianAuth} = viewer
  const accessToken = (atlassianAuth && atlassianAuth.accessToken) || undefined
  useFreshToken(accessToken, retry)

  const openOAuth = () => {
    AtlassianClientManager.openOAuth(atmosphere, teamId, mutationProps)
  }

  const {sites, status} = useAtlassianSites(accessToken)
  const {togglePortal, originRef, menuPortal, menuProps} = useMenu(MenuPosition.UPPER_RIGHT)
  const isDesktop = useBreakpoint(DASH_SIDEBAR.BREAKPOINT)
  return (
    <ProviderCard>
      <AtlassianProviderLogo />
      <RowInfo>
        <ProviderName>{Providers.ATLASSIAN_NAME}</ProviderName>
        <RowInfoCopy>{Providers.ATLASSIAN_DESC}</RowInfoCopy>
      </RowInfo>
      {!accessToken && (
        <ProviderActions>
          <StyledButton key='linkAccount' onClick={openOAuth} palette='warm' waiting={submitting}>
            {isDesktop ? 'Connect' : <Icon>add</Icon>}
          </StyledButton>
        </ProviderActions>
      )}
      {accessToken && (
        <ListAndMenu>
          <SiteList>
            {status === 'loaded' &&
              sites.map((site, idx) => (
                <SiteAvatar
                  key={site.id}
                  width={24}
                  height={24}
                  src={site.avatarUrl}
                  title={site.name}
                  idx={sites.length - idx}
                />
              ))}
            {status === 'loading' && (
              <LoadingComponent spinnerSize={24} height={24} showAfter={0} />
            )}
          </SiteList>
          <MenuButton onClick={togglePortal} ref={originRef}>
            <StyledIcon>more_vert</StyledIcon>
          </MenuButton>
          {menuPortal(
            <AtlassianConfigMenu
              mutationProps={mutationProps}
              menuProps={menuProps}
              teamId={teamId}
            />
          )}
        </ListAndMenu>
      )}
    </ProviderCard>
  )
}

graphql`
  fragment AtlassianProviderRowViewer on User {
    atlassianAuth(teamId: $teamId) {
      accessToken
    }
  }
`

export default createFragmentContainer(
  withAtmosphere(withMutationProps(withRouter(AtlassianProviderRow))),
  {
    viewer: graphql`
      fragment AtlassianProviderRow_viewer on User {
        ...AtlassianProviderRowViewer @relay(mask: false)
      }
    `
  }
)

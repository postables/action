import React, {ReactElement, ReactPortal, Ref, Suspense, useEffect} from 'react'
import styled from '@emotion/styled'
import ErrorBoundary from '../components/ErrorBoundary'
import LoadingComponent from '../components/LoadingComponent/LoadingComponent'
import ModalError from '../components/ModalError'
import {LoadingDelayRef} from './useLoadingDelay'
import usePortal, {PortalStatus} from './usePortal'
import {DECELERATE} from '../styles/animation'
import {PALETTE} from '../styles/paletteV2'
import {Duration, ZIndex} from '../types/constEnums'

const ModalBlock = styled('div')({
  alignItems: 'center',
  display: 'flex',
  height: '100%',
  justifyContent: 'center',
  left: 0,
  // no margins or paddings since they could force it too low & cause a scrollbar to appear
  position: 'absolute',
  top: 0,
  width: '100%',
  zIndex: ZIndex.MODAL
})

const backdropStyles = {
  [PortalStatus.Entering]: {
    opacity: 1,
    transition: `opacity ${Duration.MODAL_OPEN}ms ${DECELERATE}`
  },
  [PortalStatus.Exiting]: {
    opacity: 0,
    transition: `opacity ${Duration.PORTAL_CLOSE}ms ${DECELERATE}`
  },
  [PortalStatus.Mounted]: {
    opacity: 0
  }
}

const modalStyles = {
  [PortalStatus.Mounted]: {
    opacity: 0,
    transform: 'translateY(32px)'
  },
  [PortalStatus.Entering]: {
    opacity: 1,
    transform: 'translateY(0)',
    transition: `all ${Duration.MODAL_OPEN}ms ${DECELERATE}`
  },
  [PortalStatus.Entered]: {
    // wipe transform so it plays nicely with react-beautiful-dnd
  },
  [PortalStatus.Exiting]: {
    opacity: 0,
    transform: 'translateY(-32px)',
    transition: `all ${Duration.PORTAL_CLOSE}ms ${DECELERATE}`
  }
}
const Backdrop = styled('div')<{background: string; portalStatus: PortalStatus}>(
  ({background, portalStatus}) => ({
    background,
    height: '100%',
    position: 'fixed',
    width: '100%',
    ...backdropStyles[portalStatus]
  })
)

const ModalContents = styled('div')<{portalStatus: PortalStatus}>(({portalStatus}) => ({
  display: 'flex',
  flex: '0 1 auto',
  flexDirection: 'column',
  position: 'relative',
  ...modalStyles[portalStatus]
}))

const useModalPortal = (
  portal: (el: ReactElement) => ReactPortal | null,
  targetRef: Ref<HTMLDivElement>,
  portalStatus: PortalStatus,
  setPortalStatus: ReturnType<typeof usePortal>['setPortalStatus'],
  loadingDelayRef: LoadingDelayRef,
  closePortal: () => void,
  background: string | undefined
) => {
  useEffect(() => {
    let isMounted = true
    if (portalStatus === PortalStatus.Entering) {
      setTimeout(() => {
        if (isMounted) {
          setPortalStatus(PortalStatus.Entered)
        }
      }, Duration.MODAL_OPEN)
    }
    return () => {
      isMounted = false
    }
  }, [portalStatus, setPortalStatus])
  return (reactEl) => {
    return portal(
      <ModalBlock ref={targetRef as any}>
        <Backdrop
          onClick={closePortal}
          background={background || PALETTE.BACKGROUND_BACKDROP}
          portalStatus={portalStatus}
        />
        <ErrorBoundary
          fallback={(error) => <ModalError error={error} portalStatus={portalStatus} />}
        >
          <ModalContents portalStatus={portalStatus}>
            <Suspense
              fallback={
                <LoadingComponent
                  loadingDelayRef={loadingDelayRef}
                  spinnerSize={24}
                  height={24}
                  showAfter={0}
                />
              }
            >
              {reactEl}
            </Suspense>
          </ModalContents>
        </ErrorBoundary>
      </ModalBlock>
    )
  }
}

export default useModalPortal

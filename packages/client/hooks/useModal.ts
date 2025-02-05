import {useRef} from 'react'
import useLoadingDelay from './useLoadingDelay'
import useModalPortal from './useModalPortal'
import usePortal, {UsePortalOptions} from './usePortal'

interface Options extends UsePortalOptions {
  background?: string
  loadingWidth?: number
}

const useModal = (options: Options = {}) => {
  const {background, onOpen, onClose} = options
  const targetRef = useRef<HTMLDivElement>(null)
  const {portal, closePortal, togglePortal, portalStatus, setPortalStatus} = usePortal({
    onOpen,
    onClose
  })
  const {loadingDelay, loadingDelayRef} = useLoadingDelay()
  const modalPortal = useModalPortal(
    portal,
    targetRef,
    portalStatus,
    setPortalStatus,
    loadingDelayRef,
    closePortal,
    background
  )
  return {togglePortal, modalPortal, closePortal, loadingDelay}
}

export default useModal

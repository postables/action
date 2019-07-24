import {useCallback} from 'react'
import useHotkey from './useHotkey'
import useRefState from './useRefState'
import useBreakpoint from './useBreakpoint'
import {DASH_SIDEBAR} from '../components/Dashboard/DashSidebar'

const useSidebar = () => {
  const isDesktop = useBreakpoint(DASH_SIDEBAR.BREAKPOINT)
  const [isOpen, setIsOpen] = useRefState(isDesktop)
  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(!isOpen.current)
  }, [])

  const handleMenuClick = useCallback(() => {
    if (isOpen.current && !isDesktop) {
      setIsOpen(false)
    }
  }, [isDesktop])

  useHotkey(`shift+left`, close)
  useHotkey(`shift+right`, open)
  return {isOpen: isOpen.current, toggle, handleMenuClick}
}

export default useSidebar
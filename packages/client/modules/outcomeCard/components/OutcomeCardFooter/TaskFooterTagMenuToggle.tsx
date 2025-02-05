import {EditorState} from 'draft-js'
import React from 'react'
import CardButton from '../../../../components/CardButton'
import IconLabel from '../../../../components/IconLabel'
import {MenuPosition} from '../../../../hooks/useCoords'
import useMenu from '../../../../hooks/useMenu'
import lazyPreload from '../../../../utils/lazyPreload'
import {MenuMutationProps} from '../../../../hooks/useMutationProps'
import {AreaEnum} from '../../../../types/graphql'

interface Props {
  area: AreaEnum
  editorState: EditorState
  isAgenda: boolean
  task: any
  toggleMenuState: () => void
  mutationProps: MenuMutationProps
}

const TaskFooterTagMenu = lazyPreload(() =>
  import(/* webpackChunkName: 'TaskFooterTagMenu' */ '../OutcomeCardStatusMenu/TaskFooterTagMenu')
)

const TaskFooterTagMenuToggle = (props: Props) => {
  const {area, editorState, isAgenda, mutationProps, task, toggleMenuState} = props
  const {togglePortal, originRef, menuPortal, menuProps} = useMenu(MenuPosition.UPPER_RIGHT, {
    onOpen: toggleMenuState,
    onClose: toggleMenuState
  })

  return (
    <>
      <CardButton
        onMouseEnter={TaskFooterTagMenu.preload}
        ref={originRef}
        onClick={togglePortal}
      >
        <IconLabel icon='more_vert' />
      </CardButton>
      {menuPortal(
        <TaskFooterTagMenu
          area={area}
          editorState={editorState}
          isAgenda={isAgenda}
          menuProps={menuProps}
          task={task}
          mutationProps={mutationProps}
        />
      )}
    </>
  )
}

export default TaskFooterTagMenuToggle

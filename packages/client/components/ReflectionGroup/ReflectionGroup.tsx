import {ReflectionGroup_meeting} from '../../__generated__/ReflectionGroup_meeting.graphql'
import {ReflectionGroup_reflectionGroup} from '../../__generated__/ReflectionGroup_reflectionGroup.graphql'
import React, {Component} from 'react'
import {ConnectDropTarget, DropTarget, DropTargetConnector, DropTargetMonitor, DropTargetSpec} from 'react-dnd'
import styled from '@emotion/styled'
import {commitLocalUpdate, createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import Modal from '../Modal'
import DraggableReflectionCard from '../ReflectionCard/DraggableReflectionCard'
import ReflectionGroupHeader from '../ReflectionGroupHeader'
import withAtmosphere, {WithAtmosphereProps} from '../../decorators/withAtmosphere/withAtmosphere'
import {STANDARD_CURVE} from '../../styles/animation'
import {GROUP, REFLECTION_CARD} from '../../utils/constants'
import getScaledModalBackground from '../../utils/multiplayerMasonry/getScaledModalBackground'
import initializeModalGrid from '../../utils/multiplayerMasonry/initializeModalGrid'
import {
  CARD_PADDING,
  EXIT_DURATION,
  MIN_ITEM_DELAY,
  MIN_VAR_ITEM_DELAY,
  MODAL_PADDING
} from '../../utils/multiplayerMasonry/masonryConstants'
import updateReflectionsInModal from '../../utils/multiplayerMasonry/updateReflectionsInModal'
import withMutationProps, {WithMutationProps} from '../../utils/relay/withMutationProps'
import {MasonryChildrenCache, MasonryItemCache, MasonryParentCache, SetChildRef, SetItemRef} from '../PhaseItemMasonry'
import {DragReflectionDropTargetTypeEnum} from '../../types/graphql'
import {cardStackPerspectiveY} from '../../styles/cards'
import updateColumnHeight from '../../utils/multiplayerMasonry/updateColumnHeight'
import {ClassNames} from '@emotion/core'

interface PassedProps {
  meeting: ReflectionGroup_meeting
  reflectionGroup: ReflectionGroup_reflectionGroup
  itemCache: MasonryItemCache
  childrenCache: MasonryChildrenCache
  parentCache: MasonryParentCache
  setItemRef: SetItemRef
  setChildRef: SetChildRef
}

interface CollectedProps {
  connectDropTarget: ConnectDropTarget
  canDrop: boolean
}

interface Props extends WithAtmosphereProps, WithMutationProps, PassedProps, CollectedProps {
}

const reflectionsStyle = (
  css: any,
  canDrop: boolean | undefined,
  isDraggable: boolean | undefined,
  canExpand: boolean | undefined,
  isComplete: boolean | null
) =>
  css({
    cursor: !isComplete && (isDraggable || canExpand) ? 'pointer' : 'default',
    opacity: canDrop ? 0.6 : 1,
    position: 'relative'
  })

// use a background so we can use scale instead of width/height for 60fps animations
const Background = styled('div')({
  backgroundColor: 'rgba(68, 66, 88, .65)',
  opacity: 0,
  position: 'absolute',
  top: 0,
  left: 0
})

interface GroupProps {
  isModal?: boolean | null
  isHidden?: boolean | null
  gutterN?: number | null
}

const GroupStyle = styled('div')<GroupProps>(
  {
    padding: CARD_PADDING,
    position: 'absolute',
    // display was 'inline-block' which causes layout issues (TA)
    display: 'block',
    transition: 'transform 200ms'
  },
  ({gutterN}) =>
    gutterN && {
      paddingBottom: CARD_PADDING + gutterN * cardStackPerspectiveY
    },
  ({isModal}) =>
    isModal && {
      borderRadius: 8,
      padding: MODAL_PADDING,
      position: 'absolute',
      transition: 'unset',
      zIndex: 100
    },
  ({isHidden}) =>
    isHidden && {
      opacity: 0,
      pointerEvents: 'none'
    }
)

interface State {
  isEditingSingleCardTitle: boolean
}

class ReflectionGroup extends Component<Props, State> {
  isClosing = false
  backgroundRef?: HTMLDivElement | null
  headerRef?: HTMLDivElement | null
  modalRef?: HTMLDivElement | null
  titleInputRef = React.createRef<HTMLInputElement>()
  state: State = {
    isEditingSingleCardTitle:
      (this.props.reflectionGroup.reflections.length === 1 &&
        this.props.reflectionGroup.titleIsUserDefined) ||
      false
  }

  componentDidUpdate (prevProps: Props) {
    const {
      reflectionGroup: {isExpanded: wasExpanded, reflections: oldReflections}
    } = prevProps
    const {childrenCache, itemCache, parentCache, reflectionGroup} = this.props
    const {isExpanded, reflectionGroupId, reflections} = reflectionGroup
    if (wasExpanded !== isExpanded) {
      if (isExpanded) {
        initializeModalGrid(
          reflections,
          parentCache,
          itemCache,
          childrenCache[reflectionGroupId],
          this.headerRef,
          this.modalRef,
          this.backgroundRef
        )
      }
    }
    if (this.modalRef && reflections.length !== oldReflections.length && !this.isClosing) {
      const oldReflectionsIds = new Set(oldReflections.map((reflection) => reflection.id))
      const newReflections = reflections.filter(
        (reflection) => !oldReflectionsIds.has(reflection.id)
      )
      const itemIds = newReflections.map((reflection) => reflection.id)
      updateReflectionsInModal(
        reflections,
        parentCache,
        itemCache,
        childrenCache[reflectionGroupId],
        this.headerRef,
        this.modalRef,
        this.backgroundRef,
        itemIds
      )
    }
  }

  componentWillUnmount () {
    this.closeGroupModal(true)
  }

  closeGroupModal = (isForce?: boolean) => {
    const {
      atmosphere,
      childrenCache,
      parentCache,
      itemCache,
      reflectionGroup: {isExpanded, reflectionGroupId, reflections}
    } = this.props
    if (!isExpanded || !this.modalRef || !this.backgroundRef || !parentCache.boundingBox) return
    const {
      boundingBox: {left: parentLeft, top: parentTop}
    } = parentCache
    const {style: modalStyle} = this.modalRef
    const {style: backgroundStyle} = this.backgroundRef
    const cachedFirstItem = itemCache[reflections[0].id]
    if (!cachedFirstItem.boundingBox) return
    const firstItemHeight = cachedFirstItem.boundingBox.height
    const childDuration = EXIT_DURATION + MIN_VAR_ITEM_DELAY * (reflections.length - 1)

    // set starting item styles
    reflections.forEach((reflection, idx) => {
      const cachedItem = itemCache[reflection.id]
      const {modalEl} = cachedItem
      if (!modalEl) return
      const {style: itemStyle} = modalEl
      const cardStackOffset = idx === reflections.length - 1 ? 0 : 6
      const delay = MIN_VAR_ITEM_DELAY * (reflections.length - 1 - idx)
      itemStyle.height = `${firstItemHeight}px`
      itemStyle.overflow = 'hidden'
      itemStyle.transition = `transform ${EXIT_DURATION}ms ${delay}ms ${STANDARD_CURVE}`
      itemStyle.transform = `translate(${cardStackOffset}px, ${cardStackOffset}px)`
    })
    const {boundingBox} = childrenCache[reflectionGroupId]
    if (!boundingBox) return
    const {top: collapsedTop, left: collapsedLeft} = boundingBox
    const top = collapsedTop + parentTop - MODAL_PADDING + CARD_PADDING
    const left = collapsedLeft + parentLeft - MODAL_PADDING + CARD_PADDING
    // animate child home
    modalStyle.transition = `transform ${childDuration}ms ${MIN_ITEM_DELAY}ms ${STANDARD_CURVE}`
    modalStyle.transform = `translate(${left}px,${top}px)`
    modalStyle.overflow = 'hidden'
    modalStyle.boxShadow = ''

    // animate background home
    const childCache = childrenCache[reflectionGroupId]
    const {modalBoundingBox, headerHeight} = childCache
    if (!modalBoundingBox) return
    const {height: modalHeight, width: modalWidth} = modalBoundingBox
    backgroundStyle.opacity = '0'
    backgroundStyle.transition = ['transform', 'opacity']
      .map((prop) => `${prop} ${childDuration}ms ${STANDARD_CURVE}`)
      .join()
    backgroundStyle.transform = getScaledModalBackground(
      modalHeight,
      modalWidth,
      firstItemHeight,
      headerHeight
    )
    this.isClosing = true
    const reset = (e?: TransitionEvent) => {
      this.isClosing = false
      if (e && e.target !== e.currentTarget) return
      const childCache = childrenCache[reflectionGroupId]
      childCache.headerHeight = undefined
      childCache.modalBoundingBox = undefined
      if (!childCache.el) return
      childCache.el.style.opacity = ''
      commitLocalUpdate(atmosphere, (store) => {
        const reflection = store.get(reflectionGroupId)
        if (!reflection) return
        reflection.setValue(false, 'isExpanded')
      })
      reflections.forEach((reflection) => {
        itemCache[reflection.id].modalEl = undefined
      })
      if (this.modalRef) {
        this.modalRef.removeEventListener('transitionend', reset)
      }
    }
    if (!isForce) {
      this.modalRef.addEventListener('transitionend', reset, {passive: true})
    } else {
      reset()
    }
  }

  renderReflection = (
    reflection: ReflectionGroup_reflectionGroup['reflections'][0],
    idx: number,
    {isModal, isDraggable}
  ) => {
    const {setItemRef, meeting, reflectionGroup} = this.props
    const {reflections} = reflectionGroup
    const {
      localStage: {isComplete}
    } = meeting
    return (
      // @ts-ignore
      <DraggableReflectionCard
        closeGroupModal={isModal ? this.closeGroupModal : undefined}
        key={reflection.id}
        idx={reflections.length - idx - 1}
        isDraggable={isDraggable && !isComplete}
        isModal={isModal}
        meeting={meeting}
        reflection={reflection}
        setItemRef={setItemRef}
        isSingleCardGroup={reflections.length === 1}
      />
    )
  }

  handleClick = () => {
    const {childrenCache, reflectionGroup} = this.props
    const {isExpanded, reflections, titleIsUserDefined, reflectionGroupId} = reflectionGroup
    if (reflections.length > 1 && !isExpanded) {
      this.expandGroup()
    } else if (reflections.length === 1 && !titleIsUserDefined) {
      this.setState({
        isEditingSingleCardTitle: !this.state.isEditingSingleCardTitle
      })
      setTimeout(() => {
        updateColumnHeight(childrenCache, reflectionGroupId)
        this.titleInputRef.current && this.titleInputRef.current.select()
      }, 0)
    }
  }
  expandGroup = () => {
    const {
      atmosphere,
      reflectionGroup: {isExpanded, reflectionGroupId}
    } = this.props
    if (!isExpanded) {
      commitLocalUpdate(atmosphere, (store) => {
        const reflectionGroup = store.get(reflectionGroupId)
        if (!reflectionGroup) return
        reflectionGroup.setValue(true, 'isExpanded')
      })
    }
  }

  setHeaderRef = (c) => {
    this.headerRef = c
  }

  setModalRef = (c) => {
    this.modalRef = c
  }

  setBackgroundRef = (c) => {
    this.backgroundRef = c
  }

  render () {
    const {canDrop, connectDropTarget, meeting, reflectionGroup, setChildRef} = this.props
    const {isExpanded, reflections, reflectionGroupId} = reflectionGroup
    const {
      localPhase: {phaseType},
      localStage: {isComplete}
    } = meeting
    const canExpand = !isExpanded && reflections.length > 1
    const [firstReflection] = reflections
    const isDraggable = phaseType === GROUP && !isComplete
    // always render the in-grid group so we can get a read on the size if the title is removed
    let gutterN = 0
    if (reflections.length === 2) gutterN = 1
    if (reflections.length >= 3) gutterN = 2
    return (
      <>
        <GroupStyle
          ref={setChildRef(reflectionGroupId, firstReflection.id)}
          isHidden={isExpanded}
          gutterN={gutterN}
        >
          <ReflectionGroupHeader
            ref={this.setHeaderRef}
            meeting={meeting}
            reflectionGroup={reflectionGroup}
            isEditingSingleCardTitle={this.state.isEditingSingleCardTitle}
            titleInputRef={this.titleInputRef}
          />
          <ClassNames>
            {({css}) => {
              return connectDropTarget(
                <div
                  className={reflectionsStyle(css, canDrop, isDraggable, canExpand, isComplete)}
                  onClick={this.handleClick}
                >
                  {reflections.map((reflection, idx) =>
                    this.renderReflection(reflection, idx, {isModal: false, isDraggable})
                  )}
                </div>
              )
            }}
          </ClassNames>
        </GroupStyle>
        <Modal clickToClose escToClose isOpen={isExpanded} onClose={() => this.closeGroupModal()}>
          <GroupStyle ref={this.setModalRef} isModal>
            <Background ref={this.setBackgroundRef} />
            <ReflectionGroupHeader
              isExpanded={!!isExpanded}
              ref={this.setHeaderRef}
              meeting={meeting}
              reflectionGroup={reflectionGroup}
              titleInputRef={this.titleInputRef}
            />
            <ClassNames>
              {({css}) => {
                return (
                  <div className={reflectionsStyle(css, canDrop, isDraggable, canExpand, isComplete)}>
                    {reflections.map((reflection, idx) =>
                      this.renderReflection(reflection, idx, {isModal: true, isDraggable})
                    )}
                  </div>
                )
              }}
            </ClassNames>
          </GroupStyle>
        </Modal>
      </>
    )
  }
}

export interface MasonryDropResult {
  dropTargetType: DragReflectionDropTargetTypeEnum
  dropTargetId: string
}

const reflectionDropSpec: DropTargetSpec<Props> = {
  canDrop (props, monitor) {
    return (
      monitor.isOver() &&
      monitor.getItem().reflectionGroupId !== props.reflectionGroup.reflectionGroupId
    )
  },

  drop (props, monitor) {
    if (monitor.didDrop()) return undefined
    const {reflectionGroup} = props
    const {reflectionGroupId: targetReflectionGroupId} = reflectionGroup
    return {
      dropTargetType: DragReflectionDropTargetTypeEnum.REFLECTION_GROUP,
      dropTargetId: targetReflectionGroupId
    } as MasonryDropResult
  }
}

const reflectionDropCollect = (connect: DropTargetConnector, monitor: DropTargetMonitor) => ({
  connectDropTarget: connect.dropTarget(),
  canDrop: monitor.canDrop()
})

export default createFragmentContainer<PassedProps>(
  (DropTarget as any)(REFLECTION_CARD, reflectionDropSpec, reflectionDropCollect)(
    withAtmosphere(withMutationProps(ReflectionGroup))
  ),
  {
    meeting: graphql`
      fragment ReflectionGroup_meeting on RetrospectiveMeeting {
        meetingId: id
        ...ReflectionGroupHeader_meeting
        localPhase {
          phaseType
        }
        localStage {
          isComplete
        }
        isViewerDragInProgress
      }
    `,
    reflectionGroup: graphql`
      fragment ReflectionGroup_reflectionGroup on RetroReflectionGroup {
        ...ReflectionGroupHeader_reflectionGroup
        retroPhaseItemId
        reflectionGroupId: id
        sortOrder
        titleIsUserDefined
        reflections {
          id
          retroPhaseItemId
          sortOrder
          ...DraggableReflectionCard_reflection
          ...ReflectionCard_reflection
        }
        isExpanded
      }
    `
  }
)

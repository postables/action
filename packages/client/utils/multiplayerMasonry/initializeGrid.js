import {REFLECTION_WIDTH} from './masonryConstants'
const OFFSET_DELAY = 50
const DURATION = 400

const initializeGrid = (itemCache, childrenCache, parentCache, isAnimated) => {
  const itemKeys = Object.keys(itemCache)
  itemKeys.forEach((itemKey) => {
    const item = itemCache[itemKey]
    if (!item.boundingBox) {
      const {height, top, left} = item.el.getBoundingClientRect()
      item.boundingBox = {height, top, left}
    }
  })
  const childrenKeys = Object.keys(childrenCache)
  // minimize forced layout reflows by doing all the expensive reads up front
  const heights = childrenKeys.map((childKey) => {
    const childCache = childrenCache[childKey]
    const {el} = childCache
    // !isAnimated is for the autogrouping
    return childCache.boundingBox && !isAnimated
      ? childCache.boundingBox.height
      : el.getBoundingClientRect().height
  })
  const gridBox = parentCache.el.getBoundingClientRect()
  const columnCount = Math.floor(gridBox.width / REFLECTION_WIDTH)
  const leftMargin = (gridBox.width - columnCount * REFLECTION_WIDTH) / 2
  const currentColumnHeights = new Array(columnCount).fill(0)
  parentCache.boundingBox = gridBox
  parentCache.columnLefts = currentColumnHeights.map(
    (_, idx) => REFLECTION_WIDTH * idx + leftMargin
  )

  const animateInQueue = []
  const animateOutQueue = []

  childrenKeys.forEach((childKey, idx) => {
    const childCache = childrenCache[childKey]
    const {el} = childCache
    const top = Math.min(...currentColumnHeights)
    const shortestColumnIdx = currentColumnHeights.indexOf(top)
    const left = parentCache.columnLefts[shortestColumnIdx]
    const height = heights[idx]
    childCache.boundingBox = {
      height,
      top,
      left
    }
    currentColumnHeights[shortestColumnIdx] += height
    if (isAnimated) {
      el.style.transition = 'unset'
      el.style.transform = `translate(${left}px, ${top}px)scale(0)`
      el.style.opacity = 0
      animateInQueue.push(() => {
        el.style.opacity = ''
        el.style.transition = `all ${DURATION}ms ${idx * OFFSET_DELAY}ms`
        el.style.transform = `translate(${left}px, ${top}px)scale(1)`
        return el
      })
    }
    animateOutQueue.push(() => {
      el.style.transition = ''
      el.style.transform = `translate(${left}px, ${top}px)`
    })
  })

  // again, I'm dumbfounded as to why i need 2 rAFs, but without 2, when the route changes
  // the cards will animate in from the top left instead of the elevator animation
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (isAnimated) {
        const animatedEls = animateInQueue.map((cb) => cb())
        const lastEl = animatedEls[animatedEls.length - 1]
        const wrapUp = () => {
          animateOutQueue.forEach((cb) => cb())
        }
        lastEl.addEventListener('transitionend', wrapUp, {passive: true, once: true})
      } else {
        animateOutQueue.forEach((cb) => cb())
      }
    })
  })
}

export default initializeGrid

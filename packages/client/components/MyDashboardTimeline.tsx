import {MyDashboardTimeline_viewer} from '../__generated__/MyDashboardTimeline_viewer.graphql'
import React, {Suspense} from 'react'
import styled from '@emotion/styled'
import {createFragmentContainer} from 'react-relay'
import graphql from 'babel-plugin-relay/macro'
import TimelineFeedList from './TimelineFeedList'
import TimelineSuggestedAction from './TimelineSuggestedAction'
import TimelineLoadingEvents from './TimelineLoadingEvents'
import TimelineRightDrawer from './TimelineRightDrawer'
import {DASH_TIMELINE} from '../types/constEnums'

interface Props {
  viewer: MyDashboardTimeline_viewer
}

const TimelineFeed = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  flex: 1,
  paddingLeft: DASH_TIMELINE.MIN_PADDING,
  paddingRight: DASH_TIMELINE.MIN_PADDING,
  paddingTop: 24
})

export const TimelineFeedItems = styled('div')({
  maxWidth: DASH_TIMELINE.FEED_MAX_WIDTH,
  minWidth: DASH_TIMELINE.FEED_MIN_WIDTH,
  width: '100%'
})

const FeedAndDrawer = styled('div')({
  display: 'flex',
  height: '100%'
})

const MyDashboardTimeline = (props: Props) => {
  const {viewer} = props
  return (
    <FeedAndDrawer>
      <TimelineFeed>
        <TimelineFeedItems>
          <Suspense fallback={<TimelineLoadingEvents />}>
            <TimelineSuggestedAction viewer={viewer} />
            <TimelineFeedList viewer={viewer} />
          </Suspense>
        </TimelineFeedItems>
      </TimelineFeed>
      <TimelineRightDrawer viewer={viewer} />
    </FeedAndDrawer>
  )
}

export default createFragmentContainer(MyDashboardTimeline, {
  viewer: graphql`
    fragment MyDashboardTimeline_viewer on User {
      id
      ...TimelineSuggestedAction_viewer
      ...TimelineFeedList_viewer
      ...TimelineRightDrawer_viewer
    }
  `
})

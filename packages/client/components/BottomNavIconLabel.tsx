import React, {forwardRef, Ref} from 'react'
import styled from '@emotion/styled'
import Icon from './Icon'
import {meetingBottomBarHeight} from '../styles/meeting'
import ui from '../styles/ui'

interface Props {
  className?: string
  icon: string | undefined
  iconColor: string | undefined
  label: any | undefined
}

const Inner = styled('div')({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  height: meetingBottomBarHeight,
  padding: '.5rem .75rem .25rem'
})

const StyledIcon = styled(Icon)<{iconColor?: string}>(({iconColor}) => ({
  color: iconColor ? ui.palette[iconColor] : 'inherit'
}))

const Label = styled('div')({
  color: 'inherit',
  fontSize: 12,
  height: 16,
  lineHeight: '16px'
})

const BottomNavIconLabel = forwardRef((props: Props, ref: Ref<HTMLDivElement>) => {
  const {className, icon, iconColor, label} = props
  return (
    <Inner className={className} ref={ref}>
      <StyledIcon iconColor={iconColor}>{icon}</StyledIcon>
      <Label>{label}</Label>
    </Inner>
  )
})

export default BottomNavIconLabel

import React from 'react'
import styled from '@emotion/styled'
import WebcamDeniedPermissions from './WebcamDeniedPermissions'
import WebcamPromptPermissions from './WebcamPromptPermissions'

const ModalBoundary = styled('div')({
  background: '#fff',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 500,
  minWidth: 500,
  width: 500
})

interface Props {
  status: 'prompt' | 'denied'
}

const WebcamPermissionsModal = (props: Props) => {
  const {status} = props
  return (
    <ModalBoundary>
      {status === 'prompt' ? <WebcamPromptPermissions /> : <WebcamDeniedPermissions />}
    </ModalBoundary>
  )
}

export default WebcamPermissionsModal

import sanitizeSVG from '@mattkrick/sanitize-svg'
import React, {Component} from 'react'
import styled from '@emotion/styled'
import Avatar from './Avatar/Avatar'
import AvatarInput from './AvatarInput'
import Type from './Type/Type'
import withAtmosphere, {
  WithAtmosphereProps
} from '../decorators/withAtmosphere/withAtmosphere'
import CreateUserPicturePutUrlMutation from '../mutations/CreateUserPicturePutUrlMutation'
import UpdateUserProfileMutation from '../mutations/UpdateUserProfileMutation'
import withMutationProps, {WithMutationProps} from '../utils/relay/withMutationProps'
import sendAssetToS3 from '../utils/sendAssetToS3'
import svgToPng from '../utils/svgToPng'

interface Props extends WithAtmosphereProps, WithMutationProps {
  picture: string
}

const AvatarBlock = styled('div')({
  margin: '1.5rem auto',
  width: '6rem'
})

const flexBase = {
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center'
}

const ModalBoundary = styled('div')({
  ...flexBase,
  flexDirection: 'column',
  background: '#fff',
  borderRadius: 8,
  height: 374,
  width: 700
})

class UserAvatarInput extends Component<Props> {
  onSubmit = async (file: File) => {
    const {atmosphere, setDirty, submitting, onError, onCompleted, submitMutation} = this.props
    if (submitting) return
    setDirty()
    if (file.size > 2 ** 20) {
      onError('File is too large')
      return
    }

    const variables: any = {
      image: {
        contentType: file.type,
        contentLength: file.size
      }
    }

    let pngFile
    if (file.type === 'image/svg+xml') {
      const isSanitary = await sanitizeSVG(file)
      if (!isSanitary) {
        onError('xss')
        return
      }
      const png = await svgToPng(file)
      if (png) {
        pngFile = new File([png], file.name.slice(0, -3) + 'png', {type: png.type})
        variables.pngVersion = {
          contentType: pngFile.type,
          contentLength: pngFile.size
        }
      }
    }

    submitMutation()
    const handleCompleted = async (res) => {
      const {
        createUserPicturePutUrl: {url, pngUrl}
      } = res
      const pictureUrl = await sendAssetToS3(file, url)
      if (pngUrl) {
        await sendAssetToS3(pngFile, pngUrl)
      }
      UpdateUserProfileMutation(atmosphere, {picture: pictureUrl}, {onError, onCompleted})
    }
    CreateUserPicturePutUrlMutation(atmosphere, variables, onError, handleCompleted)
  }

  render () {
    const {picture, dirty, error} = this.props
    return (
      <ModalBoundary>
        <Type align='center' bold scale='s6' colorPalette='mid'>
          {'Upload a New Photo'}
        </Type>
        <AvatarBlock>
          <Avatar picture={picture} size={96} />
        </AvatarBlock>
        <AvatarInput error={dirty ? (error as string) : undefined} onSubmit={this.onSubmit} />
      </ModalBoundary>
    )
  }
}

export default withAtmosphere(withMutationProps(UserAvatarInput))

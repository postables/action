import React from 'react'
import makePlaceholderStyles from '../styles/helpers/makePlaceholderStyles'
import styled from '@emotion/styled'
import ui from '../styles/ui'
import appTheme from '../styles/theme/appTheme'
import Icon from './Icon'
import {MD_ICONS_SIZE_18} from '../styles/icons'

const FieldBlock = styled('div')({
  position: 'relative'
})

interface StyleProps {
  hasError: boolean
}
const FieldIcon = styled(Icon)<StyleProps>(({hasError}) => ({
  color: hasError ? ui.colorError : ui.hintColor,
  display: 'block',
  fontSize: MD_ICONS_SIZE_18,
  left: '.5rem',
  opacity: 0.5,
  position: 'absolute',
  textAlign: 'center',
  top: '.6875rem'
}))

interface Props {
  autoComplete: string
  autoFocus?: boolean
  hasError: boolean
  iconName: string
  maxLength: number
  onChange: (e: React.ChangeEvent) => void
  placeholder: string
  value: string
}

const Input = styled('input')<StyleProps>(({hasError}) => ({
  ...ui.fieldBaseStyles,
  backgroundColor: ui.palette.white,
  border: 0,
  borderRadius: 0,
  boxShadow: 'none',
  color: appTheme.palette.dark,
  fontSize: '.9375rem',
  lineHeight: appTheme.typography.s6,
  padding: `.5rem .75rem .5rem 2rem`,
  ':focus, :active': {
    ...makePlaceholderStyles(ui.placeholderColorFocusActive)
  },
  '::placeholder': hasError ? ui.fieldErrorPlaceholderColor : undefined
}))

const UpgradeCreditCardFormField = (props: Props) => {
  const {
    autoComplete,
    autoFocus,
    hasError,
    iconName,
    maxLength,
    onChange,
    placeholder,
    value
  } = props

  const requireNumeric = (e) => {
    // keep Enter around to let them submit
    if (e.key !== 'Enter' && isNaN(parseInt(e.key, 10))) {
      e.preventDefault()
    }
  }

  return (
    <FieldBlock>
      <FieldIcon hasError={hasError}>{iconName}</FieldIcon>
      <Input
        hasError={hasError}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        onChange={onChange}
        maxLength={maxLength}
        placeholder={placeholder}
        onKeyPress={requireNumeric}
        type='text'
        value={value}
      />
    </FieldBlock>
  )
}

export default UpgradeCreditCardFormField

import React from 'react'
import formError from '../../../../styles/helpers/formError'
import {normalizeExpiry, normalizeNumeric} from './normalizers'
import styled from '@emotion/styled'
import ui from '../../../../styles/ui'
import appTheme from '../../../../styles/theme/appTheme'
import withAtmosphere, {
  WithAtmosphereProps
} from '../../../../decorators/withAtmosphere/withAtmosphere'
import withAsync from 'react-async-hoc'
import * as Sentry from '@sentry/browser'
import UpgradeToProMutation from '../../../../mutations/UpgradeToProMutation'
import UpdateCreditCardMutation from '../../../../mutations/UpdateCreditCardMutation'
import UpgradeCreditCardFormField from '../../../../components/UpgradeCreditCardFormField'
import {
  cardTypeLookup,
  CCValidationErrors,
  stripeFieldLookup
} from '../../../../utils/creditCardLookup'
import withMutationProps, {
  ErrorObject,
  WithMutationProps
} from '../../../../utils/relay/withMutationProps'
import PrimaryButton from '../../../../components/PrimaryButton'
import StyledFontAwesome from '../../../../components/StyledFontAwesome'
import Icon from '../../../../components/Icon'
import {ICON_SIZE_FA_2X, MD_ICONS_SIZE_18} from '../../../../styles/icons'
import {typeScale} from '../../../../styles/theme/typography'

const inputBorder = '.0625rem solid transparent'
const borderBottom = '.125rem solid transparent'

const LockIcon = styled(Icon)({
  fontSize: MD_ICONS_SIZE_18,
  lineHeight: appTheme.typography.s5,
  marginRight: '.2em'
})

const ModalBody = styled('div')({
  alignItems: 'center',
  background: ui.backgroundColor,
  display: 'flex',
  flexDirection: 'column',
  width: '100%'
})

const Heading = styled('div')({
  fontSize: typeScale[7],
  lineHeight: '1.875rem',
  marginBottom: '.25rem',
  textAlign: 'center'
})

const Subheading = styled('div')({
  alignItems: 'center',
  display: 'flex',
  fontSize: typeScale[3],
  justifyContent: 'center',
  lineHeight: typeScale[6]
})

const CreditCardIcon = styled(StyledFontAwesome)({
  alignItems: 'center',
  backgroundColor: appTheme.palette.mid70l,
  borderRadius: '100%',
  color: ui.palette.white,
  display: 'flex',
  fontSize: ICON_SIZE_FA_2X,
  height: '4rem',
  justifyContent: 'center',
  margin: '0 0 .5rem',
  textAlign: 'center',
  width: '4rem'
})

const CardInputs = styled('div')({
  borderRadius: ui.borderRadiusSmall,
  display: 'flex',
  flexDirection: 'column',
  margin: '1.25rem 0',
  // required to clip 0 border radius for input
  overflow: 'hidden',
  width: '100%'
})

const CreditCardNumber = styled('div')({
  borderBottom
})

const CardDetails = styled('div')({
  display: 'flex'
})

const CardExpiry = styled('div')({
  borderRight: inputBorder
})

const CardCvc = styled('div')({
  borderLeft: inputBorder
})

const ErrorMsg = styled('div')({
  ...formError,
  marginTop: '1rem',
  fontSize: appTheme.typography.s2
})

const ButtonGroup = styled('div')({
  display: 'flex',
  flexDirection: 'row-reverse',
  justifyContent: 'space-between',
  width: '100%'
})

const UpdateButton = styled(PrimaryButton)({
  paddingLeft: 0,
  paddingRight: 0,
  width: '100%'
})

interface Errors extends ErrorObject {
  creditCardNumber?: string
  expiry?: string
  cvc?: string
}

interface CreateTokenInput {
  number: number | string
  exp_month: number | string
  exp_year: number | string
  cvc: number | string
}
interface CreateTokenRes {
  error: {param: keyof CreateTokenInput}
  id: string
}

type CreateToken = (input: CreateTokenInput) => Promise<CreateTokenRes>

interface Props extends WithAtmosphereProps, WithMutationProps {
  createToken: CreateToken
  isUpdate: boolean
  orgId: string
  onSuccess?: () => void
  stripeCard: any
  error: Errors
}

interface State {
  cardTypeIcon: string
  creditCardNumber?: string
  cvc?: string
  expiry?: string
}

declare global {
  interface Window {
    Stripe: any
    __ACTION__: any
  }
}

class UpgradeCreditCardForm extends React.Component<Props, State> {
  state = {
    cardTypeIcon: 'credit-card',
    creditCardNumber: '',
    cvc: '',
    expiry: ''
  }

  setError = (fieldName) => {
    const {onError} = this.props
    const error = CCValidationErrors[fieldName]
    onError({[fieldName]: error})
  }

  checkCardType = (e) => {
    const {stripeCard} = this.props
    if (stripeCard && e.currentTarget.value) {
      const type = stripeCard.cardType(e.currentTarget.value)
      const cardTypeIcon = cardTypeLookup[type]
      if (cardTypeIcon !== this.state.cardTypeIcon) {
        this.setState({
          cardTypeIcon
        })
      }
    }
  }

  handleNumberChange = (e) => {
    const {dirty, onCompleted, error, stripeCard} = this.props
    this.checkCardType(e)
    const normalizedNumber = normalizeNumeric(e.target.value)
    this.setState({
      creditCardNumber: normalizedNumber
    })
    if (dirty && stripeCard) {
      const isValid = stripeCard.validateCardNumber(normalizedNumber)
      if (!isValid) {
        this.setError('creditCardNumber')
      } else if (error && error.creditCardNumber) {
        onCompleted()
      }
    }
  }

  handleExpiryChange = (e) => {
    const {dirty, onCompleted, error, stripeCard} = this.props
    const normalizedExpiry = normalizeExpiry(e.target.value)
    this.setState({
      expiry: normalizedExpiry
    })
    if (dirty && stripeCard) {
      const isValid = stripeCard.validateExpiry(normalizedExpiry)
      if (!isValid) {
        this.setError('expiry')
      } else if (error && error.expiry) {
        // clear the error
        onCompleted()
      }
    }
  }

  handleCVCChange = (e) => {
    const {dirty, onCompleted, error, stripeCard} = this.props
    const normalizedCVC = normalizeNumeric(e.target.value)
    this.setState({
      cvc: normalizedCVC
    })
    if (dirty && stripeCard) {
      const isValid = stripeCard.validateCVC(normalizedCVC)
      if (!isValid) {
        this.setError('cvc')
      } else if (error && error.cvc) {
        // clear the error
        onCompleted()
      }
    }
  }

  handleSubmit = (e) => {
    e.preventDefault()
    const {submitting, setDirty, stripeCard, submitMutation} = this.props
    if (submitting || !stripeCard) return
    const {creditCardNumber, expiry, cvc} = this.state
    // validate
    setDirty()
    const isValidNumber = stripeCard.validateCardNumber(creditCardNumber)
    if (!isValidNumber) {
      this.setError('creditCardNumber')
      return
    }
    const isValidExpiry = stripeCard.validateExpiry(expiry)
    if (!isValidExpiry) {
      this.setError('expiry')
      return
    }
    const isValidCVC = stripeCard.validateCVC(cvc)
    if (!isValidCVC) {
      this.setError('cvc')
      return
    }
    submitMutation()
    this.secureSubmitCC().catch()
  }

  secureSubmitCC = async () => {
    const {createToken} = this.props
    const {creditCardNumber, expiry, cvc} = this.state
    if (!expiry) return
    const [expMonth, expYear] = expiry.split('/')
    const {error, id: stripeToken} = await createToken({
      number: creditCardNumber,
      exp_month: expMonth,
      exp_year: expYear,
      cvc
    })
    if (error) {
      const fieldName = stripeFieldLookup[error.param]
      this.setError(fieldName)
      Sentry.captureMessage(`Bad CC param: ${error.param}`)
    } else {
      this.sendStripeToken(stripeToken)
    }
  }

  sendStripeToken = (stripeToken) => {
    const {atmosphere, isUpdate, orgId, onError, onCompleted, onSuccess} = this.props
    const handleCompleted = (data, err) => {
      onCompleted(data, err)
      if (onSuccess) {
        onSuccess()
      }
    }
    if (isUpdate) {
      UpdateCreditCardMutation(atmosphere, orgId, stripeToken, onError, handleCompleted)
    } else {
      UpgradeToProMutation(atmosphere, orgId, stripeToken, onError, handleCompleted)
    }
  }

  render () {
    const {isUpdate, dirty, error, submitting} = this.props
    const {cardTypeIcon, creditCardNumber, expiry, cvc} = this.state
    const actionLabel = isUpdate ? 'Update Credit Card' : 'Upgrade to Pro'
    return (
      <ModalBody>
        <CreditCardIcon name={cardTypeIcon} />
        <Heading>{actionLabel}</Heading>
        <Subheading>
          <LockIcon>lock</LockIcon>
          <div>
            {' Secured by '}
            <b>{'Stripe'}</b>
          </div>
        </Subheading>
        {dirty && error && <ErrorMsg>{Object.values(error)[0]}</ErrorMsg>}
        <form onSubmit={this.handleSubmit}>
          <CardInputs>
            <CreditCardNumber>
              <UpgradeCreditCardFormField
                autoComplete='cc-number'
                autoFocus
                hasError={Boolean(error && error.creditCardNumber)}
                iconName='credit_card'
                maxLength={20}
                onChange={this.handleNumberChange}
                placeholder='Card number'
                value={creditCardNumber}
              />
            </CreditCardNumber>
            <CardDetails>
              <CardExpiry>
                <UpgradeCreditCardFormField
                  autoComplete='cc-exp'
                  hasError={Boolean(error && error.expiry)}
                  iconName='date_range'
                  maxLength={5}
                  onChange={this.handleExpiryChange}
                  placeholder='MM/YY'
                  value={expiry}
                />
              </CardExpiry>
              <CardCvc>
                <UpgradeCreditCardFormField
                  autoComplete='cc-csc'
                  hasError={Boolean(error && error.cvc)}
                  iconName='lock'
                  maxLength={4}
                  onChange={this.handleCVCChange}
                  placeholder='CVC'
                  value={cvc}
                />
              </CardCvc>
            </CardDetails>
          </CardInputs>
          <ButtonGroup>
            <UpdateButton size='medium' onClick={this.handleSubmit} waiting={submitting}>
              {actionLabel}
            </UpdateButton>
          </ButtonGroup>
        </form>
      </ModalBody>
    )
  }
}

const stripeCb = () => {
  const stripe = window.Stripe
  stripe.setPublishableKey(window.__ACTION__.stripe)
  return {
    createToken: (fields) =>
      new Promise((resolve) => {
        stripe.card.createToken(fields, (_status, response) => {
          resolve(response)
        })
      }),
    stripeCard: stripe.card
  }
}

export default withAsync({'https://js.stripe.com/v2/': stripeCb})(
  withAtmosphere(withMutationProps(UpgradeCreditCardForm))
)

import PropTypes from 'prop-types'
import React from 'react'
import FieldHelpText from '../../../../components/FieldHelpText/FieldHelpText'

const StripeTokenField = (props) => {
  const {
    meta: {touched, error}
  } = props
  if (touched && error) {
    return <FieldHelpText hasErrorText helpText={error} />
  }
  return null
}

StripeTokenField.propTypes = {
  meta: PropTypes.shape({
    error: PropTypes.string,
    touched: PropTypes.bool
  })
}

export default StripeTokenField

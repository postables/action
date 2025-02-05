import Oy from 'oy-vey'
import React from 'react'
import UpcomingInvoiceEmail, {
  UpcomingInvoiceEmailProps
} from './UpcomingInvoiceEmail'
import {headCSS} from '../../../styles/email'

const subject = 'Your monthly summary'

export const makeBody = (props: UpcomingInvoiceEmailProps) => {
  const {periodEndStr, newUsers, memberUrl} = props
  const newUserBullets = newUsers.reduce(
    (str, newUser) => str + `* ${newUser.name} (${newUser.email})\n`,
    ''
  )
  return `
Hello,

Your teams have added the following users to your organization for the billing cycle ending on ${periodEndStr}:
${newUserBullets}

If any of these users were added by mistake, simply remove them under Organization Settings: ${memberUrl}

Your friends,
The Parabol Product Team
`
}

export default (props) => ({
  subject,
  body: makeBody(props),
  html: Oy.renderTemplate(<UpcomingInvoiceEmail {...props} />, {
    headCSS,
    title: subject,
    previewText: subject
  })
})

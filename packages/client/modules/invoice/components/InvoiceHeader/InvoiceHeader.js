import PropTypes from 'prop-types'
import React from 'react'
import withStyles from '../../../../styles/withStyles'
import {css} from 'aphrodite-local-styles/no-important'
import ui from '../../../../styles/ui'
import appTheme from '../../../../styles/theme/appTheme'
import defaultOrgAvatar from '../../../../styles/theme/images/avatar-organization.svg'

const InvoiceHeader = (props) => {
  const {emails, picture, orgName, styles} = props

  return (
    <div className={css(styles.header)}>
      <div className={css(styles.logoPanel)}>
        <img
          alt={`Logo for ${orgName}`}
          className={css(styles.picture)}
          src={picture || defaultOrgAvatar}
        />
      </div>
      <div className={css(styles.info)}>
        <div className={css(styles.orgName)}>{orgName}</div>
        {emails.map((email) => (
          <div key={`email${email}`} className={css(styles.email)}>
            {email}
          </div>
        ))}
      </div>
    </div>
  )
}

InvoiceHeader.propTypes = {
  emails: PropTypes.array,
  picture: PropTypes.string,
  orgName: PropTypes.string,
  styles: PropTypes.object
}

const breakpoint = ui.invoiceBreakpoint
const styleThunk = () => ({
  header: {
    alignItems: 'center',
    display: 'flex',
    fontWeight: 600
  },

  logoPanel: {
    backgroundColor: '#fff',
    border: `1px solid ${ui.invoiceBorderColor}`,
    borderRadius: '.5rem',
    height: 64,
    padding: '.5rem',
    width: 64,

    [breakpoint]: {
      height: 96,
      width: 96
    }
  },

  picture: {
    height: 'auto',
    width: '100%'
  },

  info: {
    flex: 1,
    marginLeft: '1.25rem'
  },

  orgName: {
    fontSize: appTheme.typography.s5,
    lineHeight: '1.5',

    [breakpoint]: {
      fontSize: appTheme.typography.s6
    }
  },

  email: {
    fontSize: appTheme.typography.s3,
    lineHeight: appTheme.typography.s5
  }
})

export default withStyles(styleThunk)(InvoiceHeader)

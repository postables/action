import React from 'react'
import styled from '@emotion/styled'
import TagBlock from '../../../../components/Tag/TagBlock'
import TagPro from '../../../../components/Tag/TagPro'
import makeDateString from '../../../../utils/makeDateString'
import {TierEnum} from '../../../../types/graphql'

const StyledTagBlock = styled(TagBlock)({
  marginLeft: 4,
  marginTop: -6
})

const OrgDetails = styled('div')({
  fontSize: 14,
  lineHeight: '34px',
  paddingBottom: 12
})

interface Props {
  createdAt: string
  tier: string | null
}

const OrganizationDetails = (props: Props) => {
  const {createdAt, tier} = props
  return (
    <OrgDetails>
      {'Created '}
      {makeDateString(createdAt)}
      {tier === TierEnum.pro && (
        <StyledTagBlock>
          <TagPro />
        </StyledTagBlock>
      )}
    </OrgDetails>
  )
}

export default OrganizationDetails

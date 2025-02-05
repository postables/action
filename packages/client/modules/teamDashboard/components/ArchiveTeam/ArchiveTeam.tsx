import React from 'react'
import LinkButton from '../../../../components/LinkButton'
import IconLabel from '../../../../components/IconLabel'
import Type from '../../../../components/Type/Type'

import ArchiveTeamForm from './ArchiveTeamForm'

interface Props {
  teamName: string
  teamId: string
  handleFormBlur: () => any
  handleClick: () => any
  showConfirmationField: boolean
}

const ArchiveTeam = ({
  handleClick,
  handleFormBlur,
  showConfirmationField,
  teamName,
  teamId
}: Props) => (
  <div>
    {!showConfirmationField ? (
      <div>
        <LinkButton
          aria-label='Click to permanently delete this team.'
          palette='red'
          onClick={handleClick}
        >
          <IconLabel icon='remove_circle' label='Delete Team' />
        </LinkButton>
        <Type width='auto' marginTop='.5rem' scale='s2'>
          <b>Note</b>: {'This can’t be undone.'}
        </Type>
      </div>
    ) : (
      <ArchiveTeamForm handleFormBlur={handleFormBlur} teamName={teamName} teamId={teamId} />
    )}
  </div>
)

export default ArchiveTeam

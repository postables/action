import graphql from 'babel-plugin-relay/macro'
graphql`
  fragment CompleteTeamFragWithMembers on Team {
    ...CompleteTeamFrag @relay(mask: false)
    teamMembers(sortBy: "preferredName") {
      ...CompleteTeamMemberFrag @relay(mask: false)
    }
  }
`

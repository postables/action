import Atmosphere from '../Atmosphere'
import {MenuMutationProps} from '../hooks/useMutationProps'
import makeHref from './makeHref'
import getOAuthPopupFeatures from './getOAuthPopupFeatures'
import AddAtlassianAuthMutation from '../mutations/AddAtlassianAuthMutation'

export interface JiraUser {
  self: string
  key: string
  accountId: string
  name: string
  emailAddress: string
  avatarUrls: {[key: string]: string}
  displayName: string
  active: boolean
  timeZone: string
}

export interface AccessibleResource {
  id: string
  name: string
  scopes: string[]
  avatarUrl: string
}

export interface JiraProject {
  self: string
  id: string
  key: string
  name: string
  avatarUrls: {
    '48x48': string
    '24x24': string
    '16x16': string
    '32x32': string
  }
  projectCategory: {
    self: string
    id: string
    name: string
    description: string
  }
  simplified: boolean
  style: string
}

export interface JiraProjectResponse {
  self: string
  nextPage: string
  maxResults: number
  startAt: number
  total: number
  isLast: boolean
  values: JiraProject[]
}

export interface JiraIssueType {
  self: string
  id: string
  description: string
  iconUrl: string
  name: string
  subtask: boolean
  fields?: {
    issuetype: {
      required: boolean
      name: string
      key: string
      hasDefaultValue: false
      operations: string[]
    }
  }
}

export interface AtlassianError {
  code: number
  message: string
}

interface AtlassianClientManagerOptions {
  fetch?: Window['fetch']
  refreshToken?: string
}

interface GetProjectsResult {
  cloudId: string
  newProjects: JiraProject[]
}

interface Reporter {
  id: string
}

interface Assignee {
  id: string
}

interface CreateIssueFields {
  assignee: Assignee
  summary: string
  description?: object
  reporter?: Reporter // probably can't use, it throws a lot of errors
  project?: Partial<JiraProject>
  issuetype?: Partial<JiraIssueType>
}

interface IssueCreateMetadata {
  projects: (Pick<JiraProject, 'self' | 'id' | 'key' | 'name' | 'avatarUrls'> & {
      issuetypes: JiraIssueType[]
    })[]
}

interface JiraCreateIssueResponse {
  id: string
  key: string
  self: string
}

type GetProjectsCallback = (error: AtlassianError | null, result: GetProjectsResult | null) => void

interface JiraError {
  errorMessages: any[]
  errors: {
    [fieldName: string]: string
  }
}

class AtlassianClientManager {
  static SCOPE = 'read:jira-user read:jira-work write:jira-work offline_access'
  static openOAuth (atmosphere: Atmosphere, teamId: string, mutationProps: MenuMutationProps) {
    const {submitting, onError, onCompleted, submitMutation} = mutationProps
    const providerState = Math.random()
      .toString(36)
      .substring(5)
    const redirect = makeHref('/auth/atlassian')
    const uri = `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${
      window.__ACTION__.atlassian
    }&scope=${encodeURI(
      AtlassianClientManager.SCOPE
    )}&redirect_uri=${redirect}&state=${providerState}&response_type=code&prompt=consent`

    const popup = window.open(
      uri,
      'OAuth',
      getOAuthPopupFeatures({width: 500, height: 810, top: 56})
    )
    const handler = (event) => {
      if (typeof event.data !== 'object' || event.origin !== window.location.origin || submitting) {
        return
      }
      const {code, state} = event.data
      if (state !== providerState || typeof code !== 'string') return
      submitMutation()
      AddAtlassianAuthMutation(atmosphere, {code, teamId}, {onError, onCompleted})
      popup && popup.close()
      window.removeEventListener('message', handler)
    }
    window.addEventListener('message', handler)
  }

  accessToken: string
  refreshToken?: string
  private readonly get: (url: string) => any
  private readonly post: (url: string, payload: object) => any
  // the any is for node until we can use tsc in nodeland
  cache: {[key: string]: {result: any; expiration: number | any}} = {}
  timeout = 5000

  constructor (accessToken: string, options: AtlassianClientManagerOptions = {}) {
    this.accessToken = accessToken
    this.refreshToken = options.refreshToken
    const fetch = options.fetch || window.fetch
    const headers = {
      // an Authorization requires a preflight request, ie reqs are slow
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json' as 'application/json',
      'Content-Type': 'application/json'
    }
    this.post = async (url, payload) => {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })
      return res.json()
    }

    this.get = async (url) => {
      const record = this.cache[url]
      if (!record) {
        const res = await fetch(url, {headers})
        const result = await res.json()
        this.cache[url] = {
          result,
          expiration: setTimeout(() => {
            delete this.cache[url]
          }, this.timeout)
        }
      } else {
        clearTimeout(record.expiration)
        record.expiration = setTimeout(() => {
          delete this.cache[url]
        }, this.timeout)
      }
      return this.cache[url].result
    }
  }

  async getAccessibleResources () {
    return this.get('https://api.atlassian.com/oauth/token/accessible-resources') as
      | AccessibleResource[]
      | AtlassianError
  }

  async getMyself (cloudId: string) {
    return this.get(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/myself`) as
      | JiraUser
      | AtlassianError
  }

  async getPaginatedProjects (cloudId: string, url: string, callback: GetProjectsCallback) {
    const res = (await this.get(url)) as JiraProjectResponse | AtlassianError
    if ('message' in res) {
      callback(res, null)
    } else {
      callback(null, {cloudId, newProjects: res.values})
      if (res.nextPage) {
        await this.getPaginatedProjects(cloudId, res.nextPage, callback).catch(console.error)
      }
    }
  }

  async getProjects (cloudIds: string[], callback: GetProjectsCallback) {
    return Promise.all(
      cloudIds.map(async (cloudId) => {
        return this.getPaginatedProjects(
          cloudId,
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/search?orderBy=name`,
          callback
        ).catch(console.error)
      })
    )
  }

  async getProject (cloudId: string, projectId: string) {
    return this.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/project/${projectId}`
    ) as JiraProject | AtlassianError
  }

  async convertMarkdownToADF (markdown: string) {
    return this.post('https://api.atlassian.com/pf-editor-service/convert?from=markdown&to=adf', {
      input: markdown
    }) as object
  }

  async getCreateMeta (cloudId: string, projectKeys?: string[]) {
    let args = ''
    if (projectKeys) {
      args += `projectKeys=${projectKeys.join(',')}`
    }
    if (args.length) {
      args = '?' + args
    }
    return this.get(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/createmeta${args}`
    ) as IssueCreateMetadata | AtlassianError | JiraError
  }

  async createIssue (cloudId: string, projectKey: string, issueFields: CreateIssueFields) {
    const payload = {
      fields: {
        project: {
          key: projectKey
        },
        ...issueFields
      } as CreateIssueFields
    }
    return this.post(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue`, payload) as
      | JiraCreateIssueResponse
      | AtlassianError
      | JiraError
  }
}

export default AtlassianClientManager

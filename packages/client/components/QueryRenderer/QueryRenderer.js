/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict'

const React = require('react')
const ReactRelayQueryFetcher = require('react-relay/lib/ReactRelayQueryFetcher')
const ReactRelayContext = require('react-relay/lib/ReactRelayContext')

const areEqual = require('fbjs/lib/areEqual')

// const {deepFreeze} = require('relay-runtime');

import type {FetchPolicy} from './ReactRelayTypes'
import type {
  CacheConfig,
  GraphQLTaggedNode,
  IEnvironment,
  RelayContext,
  RequestParameters,
  Snapshot,
  Variables
} from 'relay-runtime'
type RetryCallbacks = {
  handleDataChange:
    | null
    | (({
        error?: Error,
        snapshot?: Snapshot
      }) => void),
  handleRetryAfterError: null | ((error: Error) => void)
}

export type RenderProps<T> = {|
  error: ?Error,
  props: ?T,
  retry: ?() => void
|}
/**
 * React may double-fire the constructor, and we call 'fetch' in the
 * constructor. If a request is already in flight from a previous call to the
 * constructor, just reuse the query fetcher and wait for the response.
 */
const requestCache = {}

const STORE_AND_NETWORK = 'store-and-network'

export type Props = {|
  cacheConfig?: ?CacheConfig,
  fetchPolicy?: FetchPolicy,
  environment: IEnvironment,
  query: ?GraphQLTaggedNode,
  render: (renderProps: RenderProps<Object>) => React.Node,
  variables: Variables
|}

type State = {|
  error: Error | null,
  prevPropsEnvironment: IEnvironment,
  prevPropsVariables: Variables,
  prevQuery: ?GraphQLTaggedNode,
  queryFetcher: ReactRelayQueryFetcher,
  relayContext: RelayContext,
  renderProps: RenderProps<Object>,
  retryCallbacks: RetryCallbacks,
  requestCacheKey: ?string,
  snapshot: Snapshot | null
|}

/**
 * @public
 *
 * Orchestrates fetching and rendering data for a single view or view hierarchy:
 * - Fetches the query/variables using the given network implementation.
 * - Normalizes the response(s) to that query, publishing them to the given
 *   store.
 * - Renders the pending/fail/success states with the provided render function.
 * - Subscribes for updates to the root data and re-renders with any changes.
 */
class ReactRelayQueryRenderer extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)

    // Callbacks are attached to the current instance and shared with static
    // lifecyles by bundling with state. This is okay to do because the
    // callbacks don't change in reaction to props. However we should not
    // "leak" them before mounting (since we would be unable to clean up). For
    // that reason, we define them as null initially and fill them in after
    // mounting to avoid leaking memory.
    const retryCallbacks = {
      handleDataChange: null,
      handleRetryAfterError: null
    }

    let queryFetcher
    let requestCacheKey
    if (props.query) {
      const {query} = props

      const {getRequest} = props.environment.unstable_internal
      const request = getRequest(query)
      requestCacheKey = getRequestCacheKey(request.params, props.variables)
      queryFetcher = requestCache[requestCacheKey]
        ? requestCache[requestCacheKey].queryFetcher
        : new ReactRelayQueryFetcher()
    } else {
      queryFetcher = new ReactRelayQueryFetcher()
    }

    this.state = {
      prevPropsEnvironment: props.environment,
      prevPropsVariables: props.variables,
      prevQuery: props.query,
      queryFetcher,
      retryCallbacks,
      ...fetchQueryAndComputeStateFromProps(props, queryFetcher, retryCallbacks, requestCacheKey)
    }
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State): $Shape<State> | null {
    if (
      prevState.prevQuery !== nextProps.query ||
      prevState.prevPropsEnvironment !== nextProps.environment ||
      !areEqual(prevState.prevPropsVariables, nextProps.variables)
    ) {
      const {query} = nextProps
      const prevSelectionReferences = prevState.queryFetcher.getSelectionReferences()
      const cachedQuery =
        nextProps.cacheConfig && nextProps.cacheConfig.ttl && nextProps.environment.unregisterQuery
      if (cachedQuery) {
        const {getRequest} = nextProps.environment.unstable_internal
        const request = getRequest(query)
        const queryKey = getRequestCacheKey(request.params, prevState.prevPropsVariables)
        nextProps.environment.unregisterQuery(queryKey, nextProps.cacheConfig.ttl)
      } else {
        prevState.queryFetcher.disposeRequest()
      }

      let queryFetcher
      if (query) {
        const {getRequest} = nextProps.environment.unstable_internal
        const request = getRequest(query)
        const requestCacheKey = getRequestCacheKey(request.params, nextProps.variables)
        queryFetcher = requestCache[requestCacheKey]
          ? requestCache[requestCacheKey].queryFetcher
          : new ReactRelayQueryFetcher(prevSelectionReferences)
      } else {
        queryFetcher = new ReactRelayQueryFetcher(prevSelectionReferences)
      }
      return {
        prevQuery: nextProps.query,
        prevPropsEnvironment: nextProps.environment,
        prevPropsVariables: nextProps.variables,
        queryFetcher: queryFetcher,
        ...fetchQueryAndComputeStateFromProps(
          nextProps,
          queryFetcher,
          prevState.retryCallbacks
          // passing no requestCacheKey will cause it to be recalculated internally
          // and we want the updated requestCacheKey, since variables may have changed
        )
      }
    }

    return null
  }

  componentDidMount() {
    const {retryCallbacks, queryFetcher, requestCacheKey} = this.state
    if (requestCacheKey) {
      delete requestCache[requestCacheKey]
    }

    retryCallbacks.handleDataChange = (params: {error?: Error, snapshot?: Snapshot}): void => {
      const error = params.error == null ? null : params.error
      const snapshot = params.snapshot == null ? null : params.snapshot

      this.setState((prevState) => {
        const {requestCacheKey: prevRequestCacheKey} = prevState
        if (prevRequestCacheKey) {
          delete requestCache[prevRequestCacheKey]
        }

        // Don't update state if nothing has changed.
        if (snapshot === prevState.snapshot && error === prevState.error) {
          return null
        }
        return {
          renderProps: getRenderProps(
            error,
            snapshot,
            prevState.queryFetcher,
            prevState.retryCallbacks
          ),
          snapshot,
          requestCacheKey: null
        }
      })
    }

    retryCallbacks.handleRetryAfterError = (error: Error) =>
      this.setState((prevState) => {
        const {requestCacheKey: prevRequestCacheKey} = prevState
        if (prevRequestCacheKey) {
          delete requestCache[prevRequestCacheKey]
        }

        return {
          renderProps: getLoadingRenderProps(),
          requestCacheKey: null
        }
      })

    // Re-initialize the ReactRelayQueryFetcher with callbacks.
    // If data has changed since constructions, this will re-render.
    if (this.props.query) {
      queryFetcher.setOnDataChange(retryCallbacks.handleDataChange)
    }
  }

  componentDidUpdate(): void {
    // We don't need to cache the request after the component commits
    const {requestCacheKey} = this.state
    if (requestCacheKey) {
      delete requestCache[requestCacheKey]
      // HACK
      delete this.state.requestCacheKey
    }
  }

  componentWillUnmount(): void {
    const {environment, cacheConfig, query, variables} = this.props
    const {ttl = 0} = cacheConfig || {}
    const {queryFetcher} = this.state
    const cachedQuery = Boolean(query && environment.unregisterQuery && ttl)
    if (cachedQuery) {
      const {getRequest} = environment.unstable_internal
      const request = getRequest(query)
      const queryKey = getRequestCacheKey(request.params, variables)
      environment.unregisterQuery(queryKey, ttl)
    } else {
      queryFetcher.dispose()
    }
  }

  shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
    return (
      nextProps.render !== this.props.render || nextState.renderProps !== this.state.renderProps
    )
  }

  render(): React.Element<typeof ReactRelayContext.Provider> {
    const {renderProps, relayContext} = this.state
    // Note that the root fragment results in `renderProps.props` is already
    // frozen by the store; this call is to freeze the renderProps object and
    // error property if set.
    // if (__DEV__) {
    //   deepFreeze(renderProps);
    // }

    return (
      <ReactRelayContext.Provider value={relayContext}>
        {this.props.render(renderProps)}
      </ReactRelayContext.Provider>
    )
  }
}

function getContext(environment: IEnvironment, variables: Variables): RelayContext {
  return {
    environment,
    variables
  }
}
function getLoadingRenderProps(): RenderProps<Object> {
  return {
    error: null,
    props: null, // `props: null` indicates that the data is being fetched (i.e. loading)
    retry: null
  }
}

function getEmptyRenderProps(): RenderProps<Object> {
  return {
    error: null,
    props: {}, // `props: {}` indicates no data available
    retry: null
  }
}

function getRenderProps(
  error: ?Error,
  snapshot: ?Snapshot,
  queryFetcher: ReactRelayQueryFetcher,
  retryCallbacks: RetryCallbacks
): RenderProps<Object> {
  return {
    error: error ? error : null,
    props: snapshot ? snapshot.data : null,
    retry: () => {
      const syncSnapshot = queryFetcher.retry()
      if (syncSnapshot && typeof retryCallbacks.handleDataChange === 'function') {
        retryCallbacks.handleDataChange({snapshot: syncSnapshot})
      } else if (error && typeof retryCallbacks.handleRetryAfterError === 'function') {
        // If retrying after an error and no synchronous result available,
        // reset the render props
        retryCallbacks.handleRetryAfterError(error)
      }
    }
  }
}

function getRequestCacheKey(request: RequestParameters, variables: Variables): string {
  const requestID = request.id || request.text
  return JSON.stringify({
    id: String(requestID),
    variables
  })
}

function fetchQueryAndComputeStateFromProps(
  props: Props,
  queryFetcher: ReactRelayQueryFetcher,
  retryCallbacks: RetryCallbacks,
  requestCacheKey: ?string
): $Shape<State> {
  const {environment, query, variables} = props
  const genericEnvironment = (environment: IEnvironment)
  if (query) {
    const {createOperationDescriptor, getRequest} = genericEnvironment.unstable_internal
    const request = getRequest(query)
    const operation = createOperationDescriptor(request, variables)
    const relayContext = getContext(genericEnvironment, operation.variables)
    const queryKey = getRequestCacheKey(request.params, props.variables)
    const cacheQuery = Boolean(
      environment.registerQuery && props.cacheConfig && props.cacheConfig.ttl
    )
    if (cacheQuery) {
      environment.registerQuery(queryKey, queryFetcher, {
        subscriptions: props.subscriptions,
        subParams: props.subParams,
        queryVariables: operation.variables
      })
    }
    if (typeof requestCacheKey === 'string' && requestCache[requestCacheKey]) {
      // This same request is already in flight.

      const {snapshot} = requestCache[requestCacheKey]
      if (snapshot) {
        // Use the cached response
        return {
          error: null,
          relayContext,
          renderProps: getRenderProps(null, snapshot, queryFetcher, retryCallbacks),
          snapshot,
          requestCacheKey
        }
      } else {
        // Render loading state
        return {
          error: null,
          relayContext,
          renderProps: getLoadingRenderProps(),
          snapshot: null,
          requestCacheKey
        }
      }
    }

    try {
      const ttl = props.cacheConfig && props.cacheConfig.ttl
      const storeSnapshot =
        props.fetchPolicy === STORE_AND_NETWORK || !!ttl
          ? queryFetcher.lookupInStore(genericEnvironment, operation)
          : null

      const skipFetch = storeSnapshot && ttl
      if (skipFetch) {
        queryFetcher._fetchOptions = {
          cacheConfig: props.cacheConfig,
          environment: props.environment,
          onDataChange: retryCallbacks.handleDataChange,
          operation
        }
      }
      const querySnapshot =
        !skipFetch &&
        queryFetcher.fetch({
          cacheConfig: props.cacheConfig,
          environment: genericEnvironment,
          onDataChange: retryCallbacks.handleDataChange,
          operation
        })

      // Use network data first, since it may be fresher
      const snapshot = querySnapshot || storeSnapshot

      // cache the request to avoid duplicate requests
      requestCacheKey = requestCacheKey || getRequestCacheKey(request.params, props.variables)
      requestCache[requestCacheKey] = {queryFetcher, snapshot}

      if (!snapshot) {
        return {
          error: null,
          relayContext,
          renderProps: getLoadingRenderProps(),
          snapshot: null,
          requestCacheKey
        }
      }

      return {
        error: null,
        relayContext,

        renderProps: getRenderProps(null, snapshot, queryFetcher, retryCallbacks),
        snapshot,
        requestCacheKey
      }
    } catch (error) {
      return {
        error,
        relayContext,
        renderProps: getRenderProps(error, null, queryFetcher, retryCallbacks),
        snapshot: null,
        requestCacheKey
      }
    }
  } else {
    queryFetcher.dispose()
    const relayContext = getContext(genericEnvironment, variables)
    return {
      error: null,
      relayContext,
      renderProps: getEmptyRenderProps(),
      requestCacheKey: null // if there is an error, don't cache request
    }
  }
}

module.exports = ReactRelayQueryRenderer

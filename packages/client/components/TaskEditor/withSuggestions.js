import PropTypes from 'prop-types'
import React, {Component} from 'react'
import getWordAt from './getWordAt'
import resolvers from './resolvers'
import ui, {
  DEFAULT_MENU_HEIGHT,
  DEFAULT_MENU_WIDTH,
  HUMAN_ADDICTION_THRESH,
  MAX_WAIT_TIME
} from '../../styles/ui'
import completeEntity from '../../utils/draftjs/completeEnitity'
import getDraftCoords from '../../utils/getDraftCoords'
import getAnchorLocation from './getAnchorLocation'
import Loadable from 'react-loadable'
import LoadableLoading from '../LoadableLoading'
import LoadableDraftJSModal from '../LoadableDraftJSModal'

const LoadableEditorSuggestions = Loadable({
  loader: () =>
    import(
      /* webpackChunkName: 'EditorSuggestions' */
      '../../../client/components/EditorSuggestions/EditorSuggestions'
    ),
  loading: (props) => (
    <LoadableLoading {...props} height={DEFAULT_MENU_HEIGHT} width={DEFAULT_MENU_WIDTH} />
  ),
  delay: HUMAN_ADDICTION_THRESH,
  timeout: MAX_WAIT_TIME
})

const LoadableMentionableUsersRoot = Loadable({
  loader: () =>
    import(
      /* webpackChunkName: 'SuggestMentionableUsersRoot' */
      '../../../client/components/SuggestMentionableUsersRoot'
    ),
  loading: (props) => (
    <LoadableLoading {...props} height={DEFAULT_MENU_HEIGHT} width={DEFAULT_MENU_WIDTH} />
  ),
  delay: HUMAN_ADDICTION_THRESH,
  timeout: MAX_WAIT_TIME
})

const originAnchor = {
  vertical: 'top',
  horizontal: 'left'
}

const targetAnchor = {
  vertical: 'top',
  horizontal: 'left'
}

const withSuggestions = (ComposedComponent) => {
  class WithSuggestions extends Component {
    static propTypes = {
      editorRef: PropTypes.any,
      editorState: PropTypes.object.isRequired,
      handleReturn: PropTypes.func,
      handleChange: PropTypes.func,
      keyBindingFn: PropTypes.func,
      // could be readOnly, so not strictly required
      setEditorState: PropTypes.func,
      teamId: PropTypes.string.isRequired
    }

    state = {}

    setSuggestions = (suggestions) => {
      if (suggestions.length === 0) {
        this.removeModal()
      } else {
        this.setState({
          suggestions
        })
      }
    }

    keyBindingFn = (e) => {
      const {keyBindingFn} = this.props
      if (keyBindingFn) {
        keyBindingFn(e)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const {active} = this.state
        this.setState({
          active: Math.max(active - 1, 0)
        })
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const {active, suggestions} = this.state
        this.setState({
          active: Math.min(active + 1, suggestions.length - 1)
        })
      } else if (e.key === 'Tab') {
        const {active} = this.state
        this.handleSelect(active)(e)
      }
      return undefined
    }

    handleSelect = (idx) => (e) => {
      const {editorState, setEditorState} = this.props
      const {suggestions, suggestionType} = this.state
      e.preventDefault()
      const item = suggestions[idx]
      if (suggestionType === 'tag') {
        const {name} = item
        setEditorState(completeEntity(editorState, 'TAG', {value: name}, `#${name}`))
      } else if (suggestionType === 'mention') {
        // team is derived from the task itself, so userId is the real useful thing here
        const [userId] = item.id.split('::')
        setEditorState(completeEntity(editorState, 'MENTION', {userId}, item.preferredName))
      }
      this.removeModal()
    }

    handleReturn = (e) => {
      const {handleReturn} = this.props
      const {active} = this.state
      if (handleReturn) {
        handleReturn(e)
      }
      this.handleSelect(active)(e)
      return 'handled'
    }

    removeModal = () => {
      this.setState({
        active: undefined,
        suggestions: undefined,
        suggestionType: undefined
      })
    }

    checkForSuggestions = (word) => {
      const trigger = word[0]
      const triggerWord = word.slice(1)
      if (trigger === '#') {
        this.makeSuggestions(triggerWord, 'tag')
        return true
      } else if (trigger === '@') {
        this.setState({
          active: 0,
          triggerWord,
          suggestions: null,
          suggestionType: 'mention'
        })
        return true
      }
      return false
    }

    resolver = (resolveType) => {
      return resolvers[resolveType]
    }

    makeSuggestions = async (triggerWord, resolveType) => {
      // setState before promise so we can add a spinner to the component
      // this.setState({
      //  suggestionType: resolveType,
      // });
      const resolve = this.resolver(resolveType)
      const suggestions = await resolve(triggerWord)
      if (suggestions.length > 0) {
        this.setState({
          active: 0,
          suggestions,
          suggestionType: resolveType
        })
      } else {
        this.removeModal()
      }
    }

    handleChange = (editorState) => {
      const {handleChange} = this.props
      if (handleChange) {
        handleChange(editorState)
      }
      const {block, anchorOffset} = getAnchorLocation(editorState)
      const blockText = block.getText()
      const entityKey = block.getEntityAt(anchorOffset - 1)
      const {word} = getWordAt(blockText, anchorOffset - 1)

      const inASuggestion = word && !entityKey && this.checkForSuggestions(word)
      const {suggestionType} = this.state
      if (!inASuggestion && suggestionType) {
        this.removeModal()
      }
    }

    initialize = () => {
      const {suggestionType} = this.state
      if (suggestionType) {
        const {renderModal, removeModal, keyBindingFn, handleReturn} = this
        return {renderModal, removeModal, keyBindingFn, handleReturn}
      }
      return {}
    }

    renderModal = () => {
      const {active, triggerWord, suggestions, suggestionType} = this.state
      const {editorRef, editorState, setEditorState, teamId} = this.props
      const coords = getDraftCoords(editorRef)
      if (!coords) {
        setTimeout(() => {
          this.forceUpdate()
        })
        return null
      }
      if (suggestionType === 'mention') {
        return (
          <LoadableDraftJSModal
            LoadableComponent={LoadableMentionableUsersRoot}
            maxWidth={500}
            maxHeight={200}
            originAnchor={originAnchor}
            queryVars={{
              activeIdx: active,
              handleSelect: this.handleSelect,
              setSuggestions: this.setSuggestions,
              suggestions,
              triggerWord,
              teamId
            }}
            targetAnchor={targetAnchor}
            marginFromOrigin={ui.draftModalMargin}
            originCoords={coords}
          />
        )
      }
      return (
        <LoadableDraftJSModal
          LoadableComponent={LoadableEditorSuggestions}
          maxWidth={500}
          maxHeight={200}
          originAnchor={originAnchor}
          queryVars={{
            editorState,
            setEditorState,
            active,
            suggestions,
            suggestionType,
            handleSelect: this.handleSelect,
            removeModal: this.removeModal
          }}
          targetAnchor={targetAnchor}
          marginFromOrigin={ui.draftModalMargin}
          originCoords={coords}
        />
      )
    }

    render () {
      const modalProps = this.initialize()
      return <ComposedComponent {...this.props} {...modalProps} handleChange={this.handleChange} />
    }
  }
  return WithSuggestions
}

export default withSuggestions

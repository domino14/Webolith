import React, { createRef } from 'react';
import PropTypes from 'prop-types';

import $ from 'jquery';
import Dropzone from 'react-dropzone';

import Notifications from '../notifications';
import ListTable from './list_table';

const PlayOptions = {
  FLASHCARD_ENTIRE: 'savedListsFlashcardEntire',
  FLASHCARD_FIRST_MISSED: 'savedListsFlashcardFM',
  PLAY_CONTINUE: 'continue',
  PLAY_FIRST_MISSED: 'firstmissed',
  PLAY_START_OVER: 'startover',
  PLAY_DELETE: 'delete',
};
const dropzoneRef = createRef();
class SavedListDialog extends React.Component {
  static genOptions(listOptions) {
    const opts = listOptions.lists.map((option) => ({
      value: String(option.id),
      displayValue: option.name,
    }));
    return opts;
  }

  constructor() {
    super();
    this.continueList = this.continueList.bind(this);
    this.playFirstMissed = this.playFirstMissed.bind(this);
    this.resetStartOver = this.resetStartOver.bind(this);
    this.deleteList = this.deleteList.bind(this);
    this.onDrop = this.onDrop.bind(this);
  }

  componentDidUpdate() {
    $('.hovertip').tooltip({ placement: 'auto' });
  }

  onDrop(files) {
    this.props.onListUpload(files);
  }

  // For most of the following, confirm that the user actually wants to
  // do this action.
  continueList(listID) {
    Notifications.confirm(
      'Are you sure?',
      `Are you sure you wish to continue this list? You will lose any
      unsaved progress on your current lists.`,
      () => this.props.onListSubmit(listID, PlayOptions.PLAY_CONTINUE),
    );
  }

  playFirstMissed(listID) {
    Notifications.confirm(
      'Are you sure?',
      'Are you sure you wish to quiz on first missed? This will reset the list.',
      () => this.props.onListSubmit(listID, PlayOptions.PLAY_FIRST_MISSED),
    );
  }

  resetStartOver(listID) {
    Notifications.confirm(
      'Are you sure?',
      `Are you sure you wish to start over?
      You will lose all data (including first missed) for this list!`,
      () => this.props.onListSubmit(listID, PlayOptions.PLAY_START_OVER),
    );
  }

  deleteList(listID) {
    Notifications.confirm(
      'Are you sure?',
      'Do you wish to delete this list for good? It can not be recovered!',
      () => this.props.onListSubmit(listID, PlayOptions.PLAY_DELETE),
    );
  }

  flashcardList(listID) {
    this.props.onListFlashcard(listID, PlayOptions.FLASHCARD_ENTIRE);
  }

  flashcardFirstMissed(listID) {
    this.props.onListFlashcard(listID, PlayOptions.FLASHCARD_FIRST_MISSED);
  }

  render() {
    const listInfo = `You currently have ${this.props.listOptions.limits.current}
    alphagrams all over your lists. `;
    let limitInfo = '';
    if (this.props.listOptions.limits.total !== 0) {
      limitInfo = `Your limit is ${this.props.listOptions.limits.total}.`;
    }

    return (
      <div className="row">
        <div className="col-sm-11">
          <div className="row">
            <div className="col-sm-12">
              <p>
                Please select a list from below. Lists that are highlighted
                in
                {' '}
                <span className="bg-success">green</span>
                {' '}
                have already
                been played through once.
              </p>
              <p>
                {listInfo}
                {limitInfo}
              </p>
            </div>
          </div>

          {/* XXX: position: 'relative' is required here in order to get the
          play button to position its dropdown correctly (it uses offsetParent).
          this is an unfortunate hack, open to suggestions.
          see play_button.jsx */}

          <div
            className="row table-scroller"
            style={{ height: 350, overflow: 'scroll', position: 'relative' }}
          >
            <ListTable
              lists={this.props.listOptions.lists}
              continueList={(listID) => () => this.continueList(listID)}
              playFirstMissed={(listID) => () => this.playFirstMissed(listID)}
              resetStartOver={(listID) => () => this.resetStartOver(listID)}
              deleteList={(listID) => () => this.deleteList(listID)}
              flashcardList={(listID) => () => this.flashcardList(listID)}
              flashcardFirstMissed={(listID) => () => this.flashcardFirstMissed(listID)}
            />
          </div>
          <div className="row">
            <div className="col-sm-12">
              <p>
                You can also upload your own list below. The list
                must be a text file that consists of just words, one per line.
              </p>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-12">
              <Dropzone
                ref={dropzoneRef}
                onDrop={this.onDrop}
                maxFiles={1}
                maxSize={1000000}
                minSize={2}
              >
                {({ getRootProps, getInputProps }) => (
                  <section>
                    <div {...getRootProps({ className: 'dropzone' })}>
                      <input {...getInputProps()} />
                      <p>Drag and drop a file here, or click to select files</p>
                    </div>
                  </section>
                )}
              </Dropzone>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

SavedListDialog.propTypes = {
  // selectedList: PropTypes.string,
  // onSelectedListChange: PropTypes.func,
  listOptions: PropTypes.shape({
    lists: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string,
      numCurAlphagrams: PropTypes.number,
      numAlphagrams: PropTypes.number,
      questionIndex: PropTypes.number,
      goneThruOnce: PropTypes.bool,
      lastSaved: PropTypes.string,
      lastSavedDT: PropTypes.string,
    })),
    count: PropTypes.number,
    limits: PropTypes.shape({
      total: PropTypes.number,
      current: PropTypes.number,
    }),
  }).isRequired,
  onListSubmit: PropTypes.func.isRequired,
  onListFlashcard: PropTypes.func.isRequired,
  onListUpload: PropTypes.func.isRequired,
};

export default SavedListDialog;
export { PlayOptions };

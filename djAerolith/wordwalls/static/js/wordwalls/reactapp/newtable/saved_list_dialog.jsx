import React from 'react';
import $ from 'jquery';
import Dropzone from 'react-dropzone';

import Notifications from '../notifications';

import ListTable from './list_table';

class SavedListDialog extends React.Component {
  static genOptions(listOptions) {
    const opts = listOptions.lists.map(option => ({
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
    console.log('Dropped files', files);
    this.props.onListUpload(files);
  }

  // For most of the following, confirm that the user actually wants to
  // do this action.
  continueList(listID) {
    Notifications.confirm(
      'Are you sure?',
      `Are you sure you wish to continue this list? You will lose any
      unsaved progress on your current lists.`,
      () => this.props.onListSubmit(listID, 'continue'));
  }

  playFirstMissed(listID) {
    Notifications.confirm(
      'Are you sure?',
      'Are you sure you wish to quiz on first missed? This will reset the list.',
      () => this.props.onListSubmit(listID, 'firstmissed'));
  }

  resetStartOver(listID) {
    Notifications.confirm(
      'Are you sure?',
      `Are you sure you wish to start over?
      You will lose all data (including first missed) for this list!`,
      () => this.props.onListSubmit(listID, 'startover'));
  }

  deleteList(listID) {
    Notifications.confirm(
      'Are you sure?',
      'Do you wish to delete this list for good? It can not be recovered!',
      () => this.props.onListSubmit(listID, 'delete'));
  }

  render() {
    return (
      <div className="row">
        <div className="col-sm-11">
          <div className="row">
            <div className="col-sm-12">
              Please select a list from below. Lists that are highlighted
              in <span className="bg-success">green</span> have already been
              played through once.
            </div>
          </div>
          <div
            className="row table-scroller"
            style={{ maxHeight: 450, minHeight: 350, overflow: 'scroll' }}
          >
            <ListTable
              lists={this.props.listOptions.lists}
              continueList={listID => () => this.continueList(listID)}
              playFirstMissed={listID => () => this.playFirstMissed(listID)}
              resetStartOver={listID => () => this.resetStartOver(listID)}
              deleteList={listID => () => this.deleteList(listID)}
            />
          </div>
          <div className="row">
            <div className="col-sm-12">
              You can also upload your own list with the button below. The list
              must consist of just words, one per line.
            </div>
          </div>
          <div>
            <Dropzone
              ref={dropzone => (this.dropzone = dropzone)}
              onDrop={this.onDrop}
              multiple={false}
              maxSize={1000000}
              accept="text/plain"
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-info"
              onClick={() => this.dropzone.open()}
            >Upload a file</button>
          </div>
        </div>
      </div>
    );
  }
}

SavedListDialog.propTypes = {
  // selectedList: React.PropTypes.string,
  // onSelectedListChange: React.PropTypes.func,
  listOptions: React.PropTypes.shape({
    lists: React.PropTypes.arrayOf(React.PropTypes.shape({
      id: React.PropTypes.number,
      name: React.PropTypes.string,
      numCurAlphagrams: React.PropTypes.number,
      numAlphagrams: React.PropTypes.number,
      questionIndex: React.PropTypes.number,
      goneThruOnce: React.PropTypes.bool,
      lastSaved: React.PropTypes.string,
      lastSavedDT: React.PropTypes.string,
    })),
    count: React.PropTypes.number,
  }),
  onListSubmit: React.PropTypes.func,
  onListUpload: React.PropTypes.func,
};

export default SavedListDialog;

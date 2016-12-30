import React from 'react';
import $ from 'jquery';
import Notifications from '../notifications';

import ListCard from './list_card';

class SavedListDialog extends React.Component {
  static genOptions(listOptions) {
    const opts = listOptions.lists.map(option => ({
      value: String(option.id),
      displayValue: option.name,
    }));
    return opts;
  }
  /**
 *           <Select
            colSize={9}
            numItems={15}
            label="My Saved Lists"
            selectedValue={this.props.selectedList}
            onChange={event => this.props.onSelectedListChange(event.target.value)}
            options={SavedListDialog.genOptions(this.props.listOptions)}
          />
 * @return {[type]} [description]
 */
  constructor() {
    super();
    this.continueList = this.continueList.bind(this);
    this.playFirstMissed = this.playFirstMissed.bind(this);
    this.resetStartOver = this.resetStartOver.bind(this);
    this.deleteList = this.deleteList.bind(this);
  }

  componentDidUpdate() {
    $('.hovertip').tooltip({ placement: 'auto' });
  }

  // For most of the following, confirm that the user actually wants to
  // do this action.
  continueList(listID) {
    this.props.onListSubmit(listID, 'continue');
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
    const cards = this.props.listOptions.lists.map((option, idx) => (
      <div className="col-sm-6 col-md-4" key={idx}>
        <ListCard
          listID={option.id}
          listName={option.name}
          lastSaved={option.lastSaved}
          lastSavedDT={option.lastSavedDT}
          progress={option.questionIndex > option.numCurAlphagrams ?
            option.numCurAlphagrams : option.questionIndex
            // A bug where questionIndex always seems to be a multiple
            // of 50 even if the quiz is done.
          }
          totalCurQuestions={option.numCurAlphagrams}
          goneThruOnce={option.goneThruOnce}
          continueList={listID => () => this.continueList(listID)}
          playFirstMissed={listID => () => this.playFirstMissed(listID)}
          resetStartOver={listID => () => this.resetStartOver(listID)}
          deleteList={listID => () => this.deleteList(listID)}
        />
      </div>
    ));

    return (
      <div className="row">
        <div className="col-sm-12">
          <div
            className="row"
            style={{ maxHeight: 450, overflow: 'scroll' }}
          >
            {cards}
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
};

export default SavedListDialog;

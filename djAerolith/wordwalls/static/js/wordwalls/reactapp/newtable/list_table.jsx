/**
 * @fileOverview A table that represents a list of saved lists.
 */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';
import $ from 'jquery';

const PlayButton = props => (
  <div className="btn-group dropdown">
    <button
      type="button"
      className="btn btn-info"
      onClick={props.continueList(props.listID)}
    >Continue</button>
    <button
      type="button"
      className="btn btn-info dropdown-toggle"
      data-toggle="dropdown"
      aria-haspopup="true"
      aria-expanded="false"
      onClick={props.onDropdownClicked}
    ><span className="caret" /></button>

    <ul className="dropdown-menu">
      <li><a role="button" onClick={props.playFirstMissed(props.listID)}>
        Play first missed</a></li>
      <li><a role="button" onClick={props.resetStartOver(props.listID)}>
        Reset and start over</a></li>
      <li role="separator" className="divider" />
      <li><a role="button">Flashcard</a></li>
      <li><a role="button">Flashcard first missed</a></li>
      <li><a role="button">Flashcard from beginning</a></li>
      <li role="separator" className="divider" />
      <li><a role="button" onClick={props.deleteList(props.listID)}>
        <span className="text-danger">Delete</span></a></li>
    </ul>
  </div>
);

PlayButton.propTypes = {
  continueList: React.PropTypes.func,
  playFirstMissed: React.PropTypes.func,
  resetStartOver: React.PropTypes.func,
  deleteList: React.PropTypes.func,
  onDropdownClicked: React.PropTypes.func,

  listID: React.PropTypes.number,
};

function progressString(questionIndex, totalQuestions) {
  let displayedQuestionIndex = questionIndex;
  if (questionIndex > totalQuestions) {
    displayedQuestionIndex = totalQuestions;
  }
  return `${displayedQuestionIndex} / ${totalQuestions}`;
}

const SavedListRow = props => (
  <tr
    className={props.list.goneThruOnce ? 'success' : ''}
  >
    <td>
      <PlayButton
        listID={props.list.id}
        goneThruOnce={props.list.goneThruOnce}
        continueList={props.continueList}
        playFirstMissed={props.playFirstMissed}
        resetStartOver={props.resetStartOver}
        deleteList={props.deleteList}
        onDropdownClicked={props.onDropdownClicked}
      />
    </td>
    <td>{props.list.name}</td>
    <td>{progressString(props.list.questionIndex, props.list.numCurAlphagrams)}</td>
    <td>{props.list.numAlphagrams}</td>
    <td>{props.list.lastSaved}</td>
  </tr>
);

SavedListRow.propTypes = {
  list: React.PropTypes.shape({
    id: React.PropTypes.number,
    name: React.PropTypes.string,
    numCurAlphagrams: React.PropTypes.number,
    numAlphagrams: React.PropTypes.number,
    questionIndex: React.PropTypes.number,
    goneThruOnce: React.PropTypes.bool,
    lastSaved: React.PropTypes.string,
    lastSavedDT: React.PropTypes.string,
  }),
  continueList: React.PropTypes.func,
  playFirstMissed: React.PropTypes.func,
  resetStartOver: React.PropTypes.func,
  deleteList: React.PropTypes.func,
  onDropdownClicked: React.PropTypes.func,
};

class SavedListTable extends React.Component {
  componentDidMount() {
    // This is a bit of a hack to make sure the dropdown turns into
    // a dropup if there is no space. Adapted from a StackOverflow answer.
    const $tableScroller = $(this.tableNode).parent();
    $(document).on('shown.bs.dropdown', '.dropdown', function hshown() {
      // calculate the required sizes, spaces
      const $ul = $(this).children('.dropdown-menu');
      const $button = $(this).children('.dropdown-toggle');
      // Ugh, the position of the <tr>, plus the offset of the UL relative
      // to the dropdown toggle button.
      // XXX: I told you this was a hack.
      const ulOffsetTop = $ul.parent().parent().parent().position().top +
        $ul.position().top;
      // how much space would be left on the top if the dropdown opened that
      // direction
      const spaceUp = (ulOffsetTop - $button.height() - $ul.height()) -
        $tableScroller.scrollTop();
      // how much space is left at the bottom
      const spaceDown = (
        $tableScroller.scrollTop() + $tableScroller.height()) -
        (ulOffsetTop + $ul.height());
      // console.log('Space:', spaceUp, spaceDown, ulOffset,
      //   $tableScroller.scrollTop(), $tableScroller.height());
      // switch to dropup only if there is no space at the bottom
      // AND there is space at the top, or there isn't either but it
      // would be still better fit
      if (spaceDown < 0 && (spaceUp >= 0 || spaceUp > spaceDown)) {
        $(this).addClass('dropup');
      }
    }).on('hidden.bs.dropdown', '.dropdown', function hhidden() {
      // always reset after close
      $(this).removeClass('dropup');
    });
  }

  render() {
    const continueList = this.props.continueList;
    const playFirstMissed = this.props.playFirstMissed;
    const resetStartOver = this.props.resetStartOver;
    const deleteList = this.props.deleteList;
    const scrollToFit = this.props.onScrollToFit;

    const rows = this.props.lists.map((option, idx) => (
      <SavedListRow
        key={idx}
        pos={idx}
        total={this.props.lists.length}
        list={option}
        continueList={continueList}
        playFirstMissed={playFirstMissed}
        resetStartOver={resetStartOver}
        deleteList={deleteList}
        onDropdownClicked={scrollToFit}
      />
    ));

    return (
      <table
        className="table table-condensed"
        ref={domNode => (this.tableNode = domNode)}
      >
        <thead>
          <tr>
            <th>Action</th>
            <th>List Name</th>
            <th>Progress</th>
            <th>Total Questions</th>
            <th>Last Saved</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>);
  }
}

SavedListTable.propTypes = {
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

  continueList: React.PropTypes.func,
  playFirstMissed: React.PropTypes.func,
  resetStartOver: React.PropTypes.func,
  deleteList: React.PropTypes.func,
  onScrollToFit: React.PropTypes.func,
};

export default SavedListTable;

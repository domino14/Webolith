/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';
import $ from 'jquery';

class PlayButton extends React.Component {
  componentDidMount() {
    // This is a bit of a hack to make sure the dropdown turns into
    // a dropup if there is no space. Adapted from a StackOverflow answer.
    const $tableScroller = $(this.btnGroupNode).parents('.table-scroller');
    $(this.btnGroupNode).on('shown.bs.dropdown', function checkDropdown() {
      // calculate the required sizes, spaces
      const $ul = $(this).children('.dropdown-menu');
      const $button = $(this).children('.dropdown-toggle');
      // Ugh, the position of the <tr>, plus the offset of the UL relative
      // to the dropdown toggle button.
      const ulOffsetTop = $ul.parents('.list-table-row').position().top +
        $ul.position().top;
      // how much space would be left on the top if the dropdown opened that
      // direction
      const spaceUp = ulOffsetTop - $button.height() - $ul.height();
      // how much space is left at the bottom
      const spaceDown = $tableScroller.height() - (ulOffsetTop + $ul.height());
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

  componentWillUnmount() {
    $(this.btnGroupNode).off();
  }

  render() {
    return (
      <div
        className="btn-group dropdown"
        ref={domNode => (this.btnGroupNode = domNode)}
      >
        <button
          type="button"
          className="btn btn-info"
          onClick={this.props.continueList(this.props.listID)}
        >Continue</button>
        <button
          type="button"
          className="btn btn-info dropdown-toggle"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        ><span className="caret" /></button>

        <ul className="dropdown-menu">
          <li><a role="button" onClick={this.props.playFirstMissed(this.props.listID)}>
            Play first missed</a></li>
          <li><a role="button" onClick={this.props.resetStartOver(this.props.listID)}>
            Reset and start over</a></li>
          <li role="separator" className="divider" />
          <li><a role="button">Flashcard</a></li>
          <li><a role="button">Flashcard first missed</a></li>
          <li><a role="button">Flashcard from beginning</a></li>
          <li role="separator" className="divider" />
          <li><a role="button" onClick={this.props.deleteList(this.props.listID)}>
            <span className="text-danger">Delete</span></a></li>
        </ul>
      </div>
    );
  }
}

PlayButton.propTypes = {
  continueList: React.PropTypes.func,
  playFirstMissed: React.PropTypes.func,
  resetStartOver: React.PropTypes.func,
  deleteList: React.PropTypes.func,

  listID: React.PropTypes.number,
};

export default PlayButton;


/**
 * @fileOverview A card that represents a saved list.
 */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import React from 'react';


const SavedListCard = (props) => {
  let completeIcon = '';
  if (props.goneThruOnce) {
    completeIcon = (<span
      className="glyphicon glyphicon-ok-sign text-success"
    />);
  }
  return (
    <div className="well well-sm" style={{ height: 100 }}>
      <div className="row">
        <div
          className="col-sm-10 hovertip"
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'inline-block',
          }}
          data-toggle="tooltip"
          title={props.listName}
        >
          {props.listName}
        </div>
        <div
          className="col-sm-2 hovertip"
          data-toggle="tooltip"
          title="This list has been quizzed to completion."
        >{completeIcon}</div>
      </div>
      <div className="row">
        <div className="col-sm-6">
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-default dropdown-toggle"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
            >Action <span className="caret" />
            </button>
            <ul className="dropdown-menu">
              <li><a role="button" onClick={props.continueList(props.listID)}>
                Continue</a></li>
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
        </div>
        <div
          className="col-sm-6 hovertip"
          data-toggle="tooltip"
          title={`Last saved on ${props.lastSavedDT} PST`/* this sucks */}
        >
          {`${props.progress} / ${props.totalCurQuestions}`}
          <br /> {props.lastSaved}
        </div>
      </div>
    </div>
  );
};

SavedListCard.propTypes = {
  listID: React.PropTypes.number,
  listName: React.PropTypes.string,
  lastSaved: React.PropTypes.string,
  lastSavedDT: React.PropTypes.string,
  progress: React.PropTypes.number,
  totalCurQuestions: React.PropTypes.number,
  goneThruOnce: React.PropTypes.bool,

  continueList: React.PropTypes.func,
  playFirstMissed: React.PropTypes.func,
  resetStartOver: React.PropTypes.func,
  deleteList: React.PropTypes.func,
};

export default SavedListCard;

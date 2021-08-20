/* eslint-disable jsx-a11y/no-static-element-interactions,
jsx-a11y/click-events-have-key-events */
import React from 'react';
import PropTypes from 'prop-types';

const MAXIMUM_LIST_NAME_SIZE = 50;

class ListSaveBar extends React.Component {
  constructor() {
    super();
    this.state = {
      inputEditable: false,
    };
    this.handleEdit = this.handleEdit.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleAutoSaveToggle = this.handleAutoSaveToggle.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  // When we edit, the input needs to become editable and shown.
  handleEdit() {
    this.setState({
      inputEditable: true,
    });
  }

  handleNameChange(event) {
    this.props.onListNameChange(event.target.value);
  }

  handleAutoSaveToggle() {
    this.props.onAutoSaveToggle();
  }

  handleKeyPress(e) {
    const keyCode = e.which || e.keyCode;
    if (keyCode === 13) {
      this.setState({
        inputEditable: false,
      });
      this.props.onListNameChange(e.target.value.trim());
    }
  }

  render() {
    let listNameStyle;
    let listNameTitle;
    let inputStyle;
    let pencilStyle;
    let saveStyle;
    let saveClass = 'hovertip hidden-md hidden-lg';
    let listNameContainerClass;
    let saveContainerClass;
    if (this.state.inputEditable) {
      listNameStyle = {
        display: 'none',
      };
      pencilStyle = {
        display: 'none',
      };
      saveStyle = {
        display: 'none',
      };
    } else {
      listNameStyle = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 'calc(100% - 5px)',
        display: 'inline-block',
        fontWeight: '500',
      };
      pencilStyle = {
        marginLeft: '5px',
        top: '-4px',
        display: 'inline-block',
      };
      saveStyle = {
        display: 'inline-block',
      };
      inputStyle = {
        display: 'none',
      };
      listNameContainerClass = 'col-xs-10 col-md-8';
      saveContainerClass = 'col-xs-2 col-md-4';
    }
    if (this.props.autoSave) {
      saveClass = 'text-success hovertip hidden-md hidden-lg';
    }
    if (this.props.disableEditing) {
      pencilStyle = {
        display: 'none',
      };
      saveStyle = {
        display: 'none',
      };
      listNameTitle = 'You cannot change or save a list in a multiplayer table.';
      listNameContainerClass = 'col-xs-12 col-md-12';
      saveContainerClass = 'hidden';
    } else {
      listNameTitle = `This is the name of the word list. You can click the
              pencil to change the name, or the disk icon to toggle autosave.`;
    }
    return (
      <div
        style={{ whiteSpace: 'nowrap' }}
        className="row"
      >
        <div className={listNameContainerClass}>
          <div
            style={listNameStyle}
            className="hovertip"
            data-toggle="tooltip"
            title={listNameTitle}
          >
            {this.props.listName}
          </div>
          <div
            className="glyphicon glyphicon-pencil hovertip"
            aria-hidden="true"
            style={pencilStyle}
            data-toggle="tooltip"
            title="Edit the list name"
            onClick={this.handleEdit}
          />
        </div>

        <div className={saveContainerClass}>
          <div
            className={saveClass}
            style={saveStyle}
            data-toggle="tooltip"
            title="Click to toggle autosave at the end of each round."
            onClick={this.handleAutoSaveToggle}
          >
            <span
              className="glyphicon glyphicon-hdd"
            />
          </div>
          <div>
            <label
              className="checkbox-inline hidden-xs hidden-sm"
              style={saveStyle}
              htmlFor="auto-save-checkbox"
            >
              <input
                type="checkbox"
                id="auto-save-checkbox"
                checked={this.props.autoSave}
                onChange={this.handleAutoSaveToggle}
                value="autoSaveSomething"
              />
              {' '}
              Autosave
            </label>
          </div>
        </div>

        <div className="col-xs-12">
          <input
            type="text"
            className="form-control input-sm"
            style={inputStyle}
            value={this.props.listName}
            onChange={this.handleNameChange}
            onKeyPress={this.handleKeyPress}
            maxLength={MAXIMUM_LIST_NAME_SIZE}
            ref={(input) => {
              if (input != null) {
                input.focus();
              }
            }}
          />
        </div>
      </div>
    );
  }
}

ListSaveBar.defaultProps = {
  listName: '',
  autoSave: false,
};

ListSaveBar.propTypes = {
  listName: PropTypes.string,
  autoSave: PropTypes.bool,
  onListNameChange: PropTypes.func.isRequired,
  onAutoSaveToggle: PropTypes.func.isRequired,
  disableEditing: PropTypes.bool.isRequired,
};

export default ListSaveBar;

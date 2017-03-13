/* eslint-disable jsx-a11y/no-static-element-interactions */
import React from 'react';

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
    let inputStyle;
    let pencilStyle;
    let saveStyle;
    let saveClass = 'hovertip hidden-md hidden-lg';
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
    }
    if (this.props.autoSave) {
      saveClass = 'text-success hovertip hidden-md hidden-lg';
    }
    return (
      <div
        style={{ whiteSpace: 'nowrap' }}
        className="row"
      >
        <div className="col-xs-10 col-md-8">
          <div
            style={listNameStyle}
            className="hovertip"
            data-toggle="tooltip"
            title={`This is the name of the word list. You can click the
              pencil to change the name, or the disk icon to toggle autosave.`}
          >{this.props.listName}</div>
          <div
            className="glyphicon glyphicon-pencil hovertip"
            aria-hidden="true"
            style={pencilStyle}
            data-toggle="tooltip"
            title="Edit the list name"
            onClick={this.handleEdit}
          />
        </div>

        <div className="col-xs-2 col-md-4">
          <div
            className={saveClass}
            style={saveStyle}
            data-toggle="tooltip"
            title="Click to toggle autosave at the end of each round."
            onClick={this.handleAutoSaveToggle}
          ><span
            className="glyphicon glyphicon-hdd"
          />
          </div>
          <div>
            <label
              className="checkbox-inline hidden-xs hidden-sm"
              style={saveStyle}
              htmlFor="auto-save-checkbox"
            ><input
              type="checkbox"
              id="auto-save-checkbox"
              checked={this.props.autoSave}
              onChange={this.handleAutoSaveToggle}
              value="autoSaveSomething"
            /> Autosave
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
  listName: React.PropTypes.string,
  autoSave: React.PropTypes.bool,
  onListNameChange: React.PropTypes.func,
  onAutoSaveToggle: React.PropTypes.func,
};

export default ListSaveBar;

import React from 'react';

class ListSaveBar extends React.Component {
  constructor() {
    super();
    this.state = {
      inputEditable: false,
    };
    this.handleEdit = this.handleEdit.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleAutoSaveChange = this.handleAutoSaveChange.bind(this);
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

  handleAutoSaveChange(event) {
    this.props.onAutoSaveChange(event.target.checked);
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
    let spanStyle;
    let inputStyle;
    let pencilStyle;
    if (this.state.inputEditable) {
      spanStyle = {
        display: 'none',
      };
      pencilStyle = {
        display: 'none',
      };
    } else {
      spanStyle = {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'block',
        width: '100%',
      };
      inputStyle = {
        display: 'none',
      };
      pencilStyle = {
        marginLeft: '5px',
      };
    }
    return (
      <div>
        <div className="row">
          <div className="col-xs-8">
            <div className="row">
              <div className="col-xs-10">
                <span
                  style={spanStyle}
                >{this.props.listName}</span>
              </div>
              <div className="col-xs-2">
                <i
                  className="fa fa-pencil"
                  aria-hidden="true"
                  style={pencilStyle}
                  onClick={this.handleEdit}
                />
              </div>
            </div>

            <input
              type="text"
              className="form-control input-sm"
              style={inputStyle}
              value={this.props.listName}
              onChange={this.handleNameChange}
              onKeyPress={this.handleKeyPress}
              ref={(input) => {
                if (input != null) {
                  input.focus();
                }
              }}
            />
          </div>
          <div className="col-xs-4">
            <label
              className="checkbox-inline"
              htmlFor="auto-save-checkbox"
            >
              <input
                id="auto-save-checkbox"
                type="checkbox"
                checked={this.props.autoSave}
                onChange={this.handleAutoSaveChange}
              /> Autosave</label>
          </div>
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
  onAutoSaveChange: React.PropTypes.func,
};

export default ListSaveBar;

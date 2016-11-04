define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    getInitialState: function() {
      return {
        inputEditable: false,
      };
    },
    getDefaultProps: function() {
      return {
        listName: '',
        autoSave: false
      };
    },
    // When we edit, the input needs to become editable and shown.
    handleEdit: function() {
      this.setState({
        inputEditable: true
      });
    },

    handleNameChange: function(event) {
      this.props.onListNameChange(event.target.value);
    },

    handleAutoSaveChange: function(event) {
      this.props.onAutoSaveChange(event.target.checked);
    },

    handleKeyPress: function(e) {
      var keyCode;
      keyCode = e.which || e.keyCode;
      if (keyCode === 13) {
        this.setState({
          inputEditable: false
        });
        this.props.onListNameChange(e.target.value.trim());
      }
    },
    render: function() {
      var spanStyle, inputStyle, pencilStyle;
      if (this.state.inputEditable) {
        spanStyle = {'display': 'none'};
        pencilStyle = {'display': 'none'};
      } else {
        spanStyle = {
          'whiteSpace': 'nowrap',
          'overflow': 'hidden',
          'textOverflow': 'ellipsis',
          'display': 'block',
          'width': '100%'};
        inputStyle = {'display': 'none'};
        pencilStyle = {'marginLeft': '5px'};
      }
      return (
        <div>
          <div className="row">
              <div className="col-xs-8">
                <div className="row">
                  <div className="col-xs-10">
                    <span
                      style={spanStyle}>{this.props.listName}
                    </span>
                  </div>
                  <div className="col-xs-2">
                    <i className="fa fa-pencil"
                    aria-hidden="true"
                    style={pencilStyle}
                    onClick={this.handleEdit}></i>
                  </div>
                </div>

                <input
                  type="text"
                  className="form-control input-sm"
                  style={inputStyle}
                  value={this.props.listName}
                  onChange={this.handleNameChange}
                  onKeyPress={this.handleKeyPress}
                  ref={function(input) {
                    if (input != null) {
                      input.focus();
                    }
                  }}
                />
              </div>
              <div className="col-xs-4">
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={this.props.autoSave}
                    onChange={this.handleAutoSaveChange}
                  /> Autosave</label>
              </div>
          </div>
        </div>
      );
    }
  });
});
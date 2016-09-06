define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    getInitialState: function() {
      return {
        listName: this.props.initialListName,
        inputEditable: false,
        autoSave: this.props.initialAutoSave
      };
    },
    getDefaultProps: function() {
      return {
        initialListName: '',
        initialAutoSave: false
      };
    },
    // When we edit, the input needs to become editable and shown.
    handleEdit: function() {
      this.setState({
        inputEditable: true
      });
    },

    handleChange: function(event) {
      this.setState({
        listName: event.target.value
      });
    },

    handleAutoSaveChange: function() {
      this.setState({
        autoSave: !this.state.autoSave
      });
    },

    handleKeyPress: function(e) {
      var keyCode;
      keyCode = e.which || e.keyCode;
      if (keyCode === 13) {
        this.setState({
          inputEditable: false,
          listName: this.state.listName.trim()
        });
      }
    },
    render: function() {
      var spanStyle, inputStyle, pencilStyle;
      if (this.state.inputEditable) {
        spanStyle = {'display': 'none'};
        pencilStyle = {'display': 'none'};
      } else {
        inputStyle = {'display': 'none'};
      }
      return (
        <div>
          <div className="row">
            <div className="col-md-8">
              <span
                style={spanStyle}>{this.state.listName}</span>
              <input
                type="text"
                className="form-control input-sm"
                style={inputStyle}
                value={this.state.listName}
                onChange={this.handleChange}
                onKeyPress={this.handleKeyPress}
                ref={function(input) {
                  if (input != null) {
                    input.focus();
                  }
                }}
              />
              <i className="fa fa-pencil"
                aria-hidden="true"
                style={pencilStyle}
                onClick={this.handleEdit}></i>
            </div>

          </div> {/* end of first row */}
          <div className="row">
            <div className="col-md-8">
              <input
                type="checkbox"
                checked={this.state.autoSave}
                onChange={this.handleAutoSaveChange}
              />Autosave
            </div>
          </div>
        </div>
      );
    }
  });
});
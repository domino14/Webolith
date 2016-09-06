define([
  'react'
], function(React) {
  "use strict";
  return React.createClass({
    getDefaultProps: function() {
      return {
        listName: '',
        autoSave: false
      };
    },
    render: function() {
      return (
        <div>
          <span
            style={{width: 120}}>{this.props.listName}</span>
          <input
            type="text"
            style={{display: 'none'}}/>
          <i className="fa fa-pencil"
            aria-hidden="true"></i>
          <input
            type="checkbox"
            value={this.props.autoSave}/>Autosave
        </div>
      );
    }
  });
});
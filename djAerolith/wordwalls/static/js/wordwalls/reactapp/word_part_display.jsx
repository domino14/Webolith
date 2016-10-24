/**
 * @fileOverview A simple React component that displays a word, or
 * a set of front/back hooks.
 */
define([
  'react'
], function(React) {
  "use strict";

  return React.createClass({
    render: function() {
      var text;
      text = this.props.text.replace(/1/g, 'ᴄʜ').replace(/2/g, 'ʟʟ').replace(
        /3/g, 'ʀʀ');

      return (
        <span
          className={this.props.classes}
        >{text}</span>
      );
    }
  });
});
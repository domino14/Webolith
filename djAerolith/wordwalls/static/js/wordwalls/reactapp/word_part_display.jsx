/**
 * @fileOverview A simple React component that displays a word, or
 * a set of front/back hooks.
 */
define([
  'react',
  'reactapp/utils'
], function(React, Utils) {
  "use strict";

  return React.createClass({
    render: function() {
      var text;
      text = Utils.displaySpanishDigraphs(this.props.text);

      return (
        <span
          className={this.props.classes}
        >{text}</span>
      );
    }
  });
});
define([
  'react',
  'react-dom'
], function(React, ReactDOM) {
  window.console.log('before comment');
  var CommentBox = React.createClass({
    render: function() {
      return (
        <div className="commentBox">
          Hello, world! I am a CommentBox.
        </div>
      );
    }
  });
  ReactDOM.render(
    <CommentBox />,
    document.getElementById('content')
  );
  window.console.log('reactdom rendered!');
  return {};
});
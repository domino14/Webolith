/**
 * @fileOverview Chat bar
 */

import React from 'react';

class ChatBar extends React.Component {
  constructor() {
    super();
    this.state = {
      chatText: '',
    };
    this.handleChatChange = this.handleChatChange.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
  }

  setFocus() {
    this.inputBox.focus();
  }

  handleChatChange(e) {
    this.setState({
      chatText: e.target.value,
    });
  }

  handleKeyPress(e) {
    const keyCode = e.which || e.keyCode;
    if (keyCode === 13) {
      // Return/Enter
      const chat = this.state.chatText.trim();
      if (chat.length < 1) {
        return; // ignore
      }
      this.setState({
        chatText: '',
      });
      this.props.onChatSubmit(chat);
    }
  }

  render() {
    return (
      <div className="row">
        <div className="col-xs-12 col-sm-12">
          <input
            className="form-control"
            type="text"
            placeholder="Chat"
            onChange={this.handleChatChange}
            value={this.state.chatText}
            onKeyPress={this.handleKeyPress}
            onBlur={this.props.onBlur || (() => {})}
            ref={ib => (this.inputBox = ib)}
          />
        </div>
      </div>
    );
  }

}

ChatBar.propTypes = {
  onChatSubmit: React.PropTypes.func,
  onBlur: React.PropTypes.func,
};

export default ChatBar;

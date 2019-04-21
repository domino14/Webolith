import React from 'react';
import PropTypes from 'prop-types';


const WordwallsInfoBox = (props) => {
  const eventFeed = props.eventFeed.map((event) => {
    switch (event.type) {
      default:
        return <div>{event.event}</div>;
    }
  });

  return (
    <div className="panel panel-default">
      <div
        className="panel-body"
        style={{
          height: 200,
          overflow: 'auto',
        }}
        ref={(domNode) => {
          if (domNode === null) {
            return;
          }
          domNode.scrollTop = domNode.scrollHeight; // eslint-disable-line no-param-reassign
        }}
      >{eventFeed}
      </div>
    </div>
  );
};

WordwallsInfoBox.propTypes = {
  eventFeed: PropTypes.arrayOf({
    type: PropTypes.string,
    event: PropTypes.string,
  }).isRequired,
};

export default WordwallsInfoBox;

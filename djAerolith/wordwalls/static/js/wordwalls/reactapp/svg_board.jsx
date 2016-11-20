import React from 'react';

import backgroundURL from './background';

const SVGBoard = (props) => {
  const style = {
    backgroundImage: backgroundURL(props.background),
  };
  if (props.background === 'pool_table') {
    // Stretch this one.
    style.backgroundSize = '100% 100%';
  }
  // Add some margins to the SVG.
  return (
    <svg
      style={style}
      width={props.width + 10}
      height={props.height + 8}
      onMouseDown={(e) => { e.preventDefault(); }}
    >{props.children}</svg>
  );
};

SVGBoard.propTypes = {
  background: React.PropTypes.string,
  width: React.PropTypes.number,
  height: React.PropTypes.height,
  children: React.PropTypes.arrayOf(React.PropTypes.element),
};

export default SVGBoard;

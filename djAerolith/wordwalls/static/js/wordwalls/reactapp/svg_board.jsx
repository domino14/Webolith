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
  return (
    <svg
      style={style}
      width={props.width}
      height={props.height}
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

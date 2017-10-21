import React from 'react';
import PropTypes from 'prop-types';

import Styling from './style';

const WordwallsQuestionPlaceholder = props => (
  <g>
    <rect
      width={props.xSize}
      height={props.ySize}
      x={props.gridX}
      y={props.gridY}
      stroke="#7e7f7a"
      strokeWidth="1px"
      fill="none"
      strokeOpacity={props.displayStyle.showBorders ? '1' : '0'}
    />
  </g>
);

WordwallsQuestionPlaceholder.propTypes = {
  displayStyle: PropTypes.instanceOf(Styling).isRequired,
  gridX: PropTypes.number.isRequired,
  gridY: PropTypes.number.isRequired,
  xSize: PropTypes.number.isRequired,
  ySize: PropTypes.number.isRequired,
};

export default WordwallsQuestionPlaceholder;

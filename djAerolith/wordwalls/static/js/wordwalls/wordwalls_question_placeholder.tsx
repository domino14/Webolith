import React from 'react';

import Styling from './style';

interface WordwallsQuestionPlaceholderProps {
  displayStyle: Styling;
  gridX: number;
  gridY: number;
  xSize: number;
  ySize: number;
  scaleTransform: number;
}

function WordwallsQuestionPlaceholder({
  displayStyle,
  gridX,
  gridY,
  xSize,
  ySize,
  scaleTransform,
}: WordwallsQuestionPlaceholderProps) {
  return (
    <g>
      <rect
        width={xSize}
        height={ySize}
        x={gridX}
        y={gridY}
        stroke="#7e7f7a"
        strokeWidth="1px"
        fill="none"
        transform={`scale(${scaleTransform})`}
        strokeOpacity={displayStyle.showBorders ? '1' : '0'}
      />
    </g>
  );
}

export default WordwallsQuestionPlaceholder;

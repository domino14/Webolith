/* eslint-disable jsx-a11y/no-static-element-interactions,
jsx-a11y/click-events-have-key-events,jsx-a11y/anchor-is-valid */

import React from 'react';

interface PillProps {
  active: boolean;
  onPillClick: () => void;
  name: string;
}

function Pill({ active, onPillClick, name }: PillProps) {
  return (
    <li className="nav-item">
      <a
        className={`nav-link ${active ? 'active' : ''}`}
        onClick={onPillClick}
        style={{ cursor: 'pointer' }}
      >
        {name}
      </a>
    </li>
  );
}

interface PillsProps {
  activePill: string;
  stacked?: boolean;
  options: string[];
  onPillClick: (option: string) => void;
}

function Pills({
  activePill,
  stacked = false,
  options,
  onPillClick,
}: PillsProps) {
  let className: string;
  if (stacked) {
    className = 'nav nav-pills flex-column';
  } else {
    className = 'nav nav-pills';
  }
  // For every option, create a pill.
  const pills = options.map(option => (
    <Pill
      active={activePill === option}
      onPillClick={() => onPillClick(option)}
      name={option}
      key={option}
    />
  ));
  return <ul className={className}>{pills}</ul>;
}

export default Pills;

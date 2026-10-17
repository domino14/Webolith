/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react';

interface PillProps {
  active: boolean;
  onPillClick: () => void;
  name: string;
  badge?: string;
}

function Pill({
  active, onPillClick, name, badge,
}: PillProps) {
  return (
    <li className="nav-item">
      <a
        className={`nav-link ${active ? 'active' : ''}`}
        onClick={onPillClick}
        style={{ cursor: 'pointer' }}
      >
        {name}
        {badge && <span className="badge text-bg-success ms-1">{badge}</span>}
      </a>
    </li>
  );
}

interface PillsProps {
  activePill: string;
  stacked?: boolean;
  options: string[];
  onPillClick: (option: string) => void;
  // A label to show next to some options, e.g. "New".
  badges?: Record<string, string>;
}

function Pills({
  activePill,
  stacked = false,
  options,
  onPillClick,
  badges = {},
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
      badge={badges[option]}
      key={option}
    />
  ));
  return <ul className={className}>{pills}</ul>;
}

export default Pills;

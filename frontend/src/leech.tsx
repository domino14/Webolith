import React from "react";
import { Badge, Tooltip } from "@mantine/core";

// Anki's default: a card forgotten this many times is a leech, eating review
// time without sticking.
const LEECH_LAPSES = 8;

export const LeechBadge: React.FC<{ lapses: number }> = ({ lapses }) => {
  if (lapses < LEECH_LAPSES) {
    return null;
  }
  return (
    <Tooltip
      multiline
      w={300}
      withArrow
      label={`You've forgotten this card ${lapses} times. It might help to study it differently, e.g. with a mnemonic, or to reset it.`}
    >
      <Badge color="grape" variant="light">
        Leech
      </Badge>
    </Tooltip>
  );
};

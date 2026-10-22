import React from "react";
import {
  ActionIcon,
  Badge,
  Group,
  Popover,
  Text,
  Tooltip,
} from "@mantine/core";
import { IconHelp } from "@tabler/icons-react";

// Anki's default: a card forgotten this many times is a leech, eating review
// time without sticking.
const LEECH_LAPSES = 8;

export const LeechBadge: React.FC<{ lapses: number }> = ({ lapses }) => {
  if (lapses < LEECH_LAPSES) {
    return null;
  }
  return (
    <Group gap={4} wrap="nowrap">
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
      <Popover width={300} withArrow shadow="md" position="bottom">
        <Popover.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            aria-label="What is a leech?"
          >
            <IconHelp size={16} />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Text size="sm" fw={700} mb={4}>
            What is a leech?
          </Text>
          <Text size="sm" mb="xs">
            A leech is a card you keep forgetting: one you've missed at least{" "}
            {LEECH_LAPSES} times after you'd already learned it. Misses while a
            card is new, or while you're still learning or relearning it, don't
            count.
          </Text>
          <Text size="sm">
            Leeches take up a lot of review time without sticking. Reviewing
            them the same way again rarely helps; try a mnemonic, learning the
            words with their hooks or anagrams, or resetting the card.
          </Text>
        </Popover.Dropdown>
      </Popover>
    </Group>
  );
};

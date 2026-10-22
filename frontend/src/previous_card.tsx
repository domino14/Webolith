import { Timestamp } from "@bufbuild/protobuf";
import { Score } from "./gen/rpc/wordvault/api_pb";
import React, { useState } from "react";
import { Alert, Button, Group, Popover, Stack, Text } from "@mantine/core";

export interface HistoryEntry {
  score: Score;
  alphagram: string;
  nextScheduled: Timestamp;
  // Every miss of the card, including this one; the card's Lapses only
  // counts misses of cards in review.
  timesMissed: number;
  cardRepr: { [key: string]: string };
  previousCardRepr: { [key: string]: string };
}

interface PreviousCardProps {
  entry: HistoryEntry;
  handleRescore: (score: Score) => void;
  simpleRatings: boolean;
}

const fullRescoreButtons = [
  { score: Score.AGAIN, label: "Missed", color: "red" },
  { score: Score.HARD, label: "Hard", color: "yellow" },
  { score: Score.GOOD, label: "Good", color: "green" },
  { score: Score.EASY, label: "Easy", color: "gray" },
];

const simpleRescoreButtons = [
  { score: Score.AGAIN, label: "Missed", color: "red" },
  { score: Score.GOOD, label: "Right", color: "green" },
];

const PreviousCard: React.FC<PreviousCardProps> = ({
  entry,
  handleRescore,
  simpleRatings,
}) => {
  const [editPopoverOpened, setEditPopoverOpened] = useState(false);

  return (
    <Alert
      title="Previous Card"
      color="dark"
      style={{ maxWidth: 600, width: "100%", marginTop: "20px" }}
    >
      <Group style={{ justifyContent: "space-between", width: "100%" }}>
        <Stack gap={0}>
          <Text size="md" fw={500}>
            {entry.alphagram}
          </Text>
          <Text size="sm" c="dimmed">
            Score:{" "}
            <Text
              size="sm"
              span
              c={entry.score === Score.AGAIN ? "red" : "green"}
            >
              {entry.score === Score.AGAIN
                ? "MISSED"
                : simpleRatings
                  ? "RIGHT"
                  : Score[entry.score]}
            </Text>
          </Text>
          <Text size="sm" c="dimmed">
            Next Due Date: {entry.nextScheduled.toDate().toLocaleDateString()}
          </Text>
          <Text size="sm" c="dimmed">
            Times Seen: {entry.cardRepr["Reps"]}
          </Text>
          <Text>Times Missed: {entry.timesMissed}</Text>
        </Stack>
        <Popover
          trapFocus
          position="top"
          shadow="md"
          opened={editPopoverOpened}
          onChange={setEditPopoverOpened}
        >
          <Popover.Target>
            <Button size="xs" onClick={() => setEditPopoverOpened(true)}>
              Undo
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <Text>Set new rating for this card ({entry.alphagram})</Text>
            <Group mt="sm">
              {(simpleRatings ? simpleRescoreButtons : fullRescoreButtons).map(
                ({ score, label, color }) => (
                  <Button
                    key={score}
                    color={color}
                    variant="light"
                    onClick={() => {
                      handleRescore(score);
                      setEditPopoverOpened(false);
                    }}
                    size="xs"
                  >
                    {label}
                  </Button>
                ),
              )}
            </Group>
          </Popover.Dropdown>
        </Popover>
      </Group>
    </Alert>
  );
};

export default PreviousCard;

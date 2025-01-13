import { Timestamp } from "@bufbuild/protobuf";
import { Score } from "./gen/rpc/wordvault/api_pb";
import React, { useState } from "react";
import { Alert, Button, Group, Popover, Stack, Text } from "@mantine/core";
import { CardStats } from "./card_stats";
import { CardStat, ParsedFsrsCard } from "./types";

export interface HistoryEntry {
  score: Score;
  alphagram: string;
  nextScheduled: Timestamp;
  cardRepr: ParsedFsrsCard;
  previousCardRepr: ParsedFsrsCard;
}

interface PreviousCardProps {
  entry: HistoryEntry;
  handleRescore: (score: Score) => void;
}

const PreviousCard: React.FC<PreviousCardProps> = ({
  entry,
  handleRescore,
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
          <CardStats
            card={entry.cardRepr}
            textProps={{
              size: "sm",
              c: "dimmed",
            }}
            excludeStats={new Set([CardStat.LAST_SEEN])}
          />
          <Text size="sm" c="dimmed">
            Score:{" "}
            <Text
              size="sm"
              span
              c={entry.score === Score.AGAIN ? "red" : "green"}
            >
              {Score[entry.score] === "AGAIN" ? "MISSED" : Score[entry.score]}
            </Text>
          </Text>
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
              <Button
                color="red"
                variant="light"
                onClick={() => {
                  handleRescore(Score.AGAIN);
                  setEditPopoverOpened(false);
                }}
                size="xs"
              >
                Missed
              </Button>
              <Button
                color="yellow"
                variant="light"
                onClick={() => {
                  handleRescore(Score.HARD);
                  setEditPopoverOpened(false);
                }}
                size="xs"
              >
                Hard
              </Button>
              <Button
                color="green"
                variant="light"
                onClick={() => {
                  handleRescore(Score.GOOD);
                  setEditPopoverOpened(false);
                }}
                size="xs"
              >
                Good
              </Button>
              <Button
                color="gray"
                variant="light"
                onClick={() => {
                  handleRescore(Score.EASY);
                  setEditPopoverOpened(false);
                }}
                size="xs"
              >
                Easy
              </Button>
            </Group>
          </Popover.Dropdown>
        </Popover>
      </Group>
    </Alert>
  );
};

export default PreviousCard;

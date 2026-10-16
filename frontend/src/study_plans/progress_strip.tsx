import { Box, Group, Stack, Text, Tooltip } from "@mantine/core";
import { StudyPlanBlock } from "../gen/rpc/wordvault/api_pb";
import { fmt } from "./common";

// Stages with more blocks than this are drawn with merged blocks.
const MAX_BLOCKS = 80;

const mergeBlocks = (blocks: StudyPlanBlock[]) => {
  const per = Math.ceil(blocks.length / MAX_BLOCKS);
  if (per <= 1) {
    return blocks;
  }
  const merged: StudyPlanBlock[] = [];
  for (let i = 0; i < blocks.length; i += per) {
    const group = blocks.slice(i, i + per);
    merged.push(
      new StudyPlanBlock({
        lo: group[0].lo,
        hi: group[group.length - 1].hi,
        total: group.reduce((a, b) => a + b.total, 0),
        added: group.reduce((a, b) => a + b.added, 0),
      })
    );
  }
  return merged;
};

const blockColor = (b: StudyPlanBlock) => {
  if (b.added === b.total) {
    return "var(--mantine-color-blue-5)";
  }
  if (b.added > 0) {
    return "var(--mantine-color-blue-9)";
  }
  return "var(--mantine-color-default-border)";
};

type Props = {
  blocks: StudyPlanBlock[];
  descending: boolean;
  // The sort value of the next batch's first card, to mark its block.
  nextValue?: number;
};

// A row of blocks shaded by how much of each is in the vault, in the
// stage's order so progress fills from the left.
export const ProgressStrip = ({ blocks, descending, nextValue }: Props) => {
  let shown = mergeBlocks(blocks);
  if (descending) {
    shown = [...shown].reverse();
  }
  if (shown.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No alphagrams match this stage.
      </Text>
    );
  }
  return (
    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
      <Group gap={2} wrap="nowrap" h={22}>
        {shown.map((b) => {
          const isNext =
            nextValue !== undefined && nextValue >= b.lo && nextValue <= b.hi;
          return (
            <Tooltip
              key={b.lo}
              label={`Probability ${fmt(b.lo)}–${fmt(b.hi)}: ${fmt(
                b.added
              )} of ${fmt(b.total)} added${isNext ? " (next batch)" : ""}`}
            >
              <Box
                h="100%"
                style={{
                  flex: "1 1 0",
                  minWidth: 0,
                  borderRadius: 2,
                  background: blockColor(b),
                  boxShadow: isNext
                    ? "inset 0 0 0 2px var(--mantine-color-yellow-5)"
                    : undefined,
                }}
              />
            </Tooltip>
          );
        })}
      </Group>
      <Group justify="space-between">
        <Text size="xs" c="dimmed">
          {fmt(descending ? shown[0].hi : shown[0].lo)}
        </Text>
        <Text size="xs" c="dimmed">
          {fmt(
            descending ? shown[shown.length - 1].lo : shown[shown.length - 1].hi
          )}
        </Text>
      </Group>
    </Stack>
  );
};

export const ProgressLegend = () => (
  <Group gap="lg">
    {[
      ["var(--mantine-color-blue-5)", "All added"],
      ["var(--mantine-color-blue-9)", "Some added"],
      ["var(--mantine-color-default-border)", "None added"],
    ].map(([color, label]) => (
      <Group key={label} gap={6}>
        <Box w={12} h={12} style={{ borderRadius: 2, background: color }} />
        <Text size="xs" c="dimmed">
          {label}
        </Text>
      </Group>
    ))}
    <Group gap={6}>
      <Box
        w={12}
        h={12}
        style={{
          borderRadius: 2,
          boxShadow: "inset 0 0 0 2px var(--mantine-color-yellow-5)",
        }}
      />
      <Text size="xs" c="dimmed">
        Next batch
      </Text>
    </Group>
  </Group>
);

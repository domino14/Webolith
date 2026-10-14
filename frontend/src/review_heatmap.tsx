import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Group,
  ScrollArea,
  Text,
  Tooltip,
  useMantineColorScheme,
  useMantineTheme,
} from "@mantine/core";
import { Score } from "./gen/rpc/wordvault/api_pb";

const SQUARE = 12;
const GAP = 3;

type ReviewLogEntry = {
  Rating: number;
  Review: string;
  ImportLog?: { ImportedDate?: string };
};

type Day = {
  date: Date;
  ratings: number[];
  imported: boolean;
};

// Local calendar date, so days match the user's timezone like the daily stats.
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

interface ReviewHeatmapProps {
  reviewLog: ReviewLogEntry[];
}

// One square per day, GitHub-style, colored by the first rating that day.
const ReviewHeatmap: React.FC<ReviewHeatmapProps> = ({ reviewLog }) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";
  const viewport = useRef<HTMLDivElement>(null);
  // One tooltip for the whole grid, labeled with the hovered day, rather than
  // a Tooltip component per square.
  const [hovered, setHovered] = useState<Day | null>(null);

  const { ratingColors, importColor, emptyColor } = useMemo(
    () => ({
      ratingColors: {
        1: theme.colors.red[6],
        2: theme.colors.yellow[6],
        3: theme.colors.green[6],
        4: theme.colors.pink[6],
      } as { [rating: number]: string },
      importColor: theme.colors.blue[4],
      emptyColor: isDark ? theme.colors.dark[5] : theme.colors.gray[2],
    }),
    [theme, isDark],
  );

  const weeks = useMemo(() => {
    if (reviewLog.length === 0) {
      return [];
    }
    const byDay = new Map<string, { ratings: number[]; imported: boolean }>();
    let first = startOfDay(new Date());
    for (const rl of reviewLog) {
      // Import entries have a zero Review time (0001-01-01); without this the
      // calendar would start in year 1 and render hundreds of thousands of
      // days.
      const d = new Date(rl.ImportLog?.ImportedDate ?? rl.Review);
      if (isNaN(d.getTime()) || d.getFullYear() < 1970) {
        continue;
      }
      if (d < first) {
        first = startOfDay(d);
      }
      const k = dayKey(d);
      const day = byDay.get(k) ?? { ratings: [], imported: false };
      if (rl.ImportLog) {
        day.imported = true;
      } else {
        day.ratings.push(rl.Rating);
      }
      byDay.set(k, day);
    }

    // Columns are weeks starting on Sunday, from the first review to today.
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const today = startOfDay(new Date());
    const result: Day[][] = [];
    // Step by calendar day, not by 24h, so DST changes don't skip a day.
    for (let d = new Date(start); d <= today; ) {
      const week: Day[] = [];
      for (let i = 0; i < 7 && d <= today; i++) {
        const day = byDay.get(dayKey(d));
        week.push({
          date: new Date(d),
          ratings: day?.ratings ?? [],
          imported: day?.imported ?? false,
        });
        d.setDate(d.getDate() + 1);
      }
      result.push(week);
    }
    return result;
  }, [reviewLog]);

  // Start scrolled to the most recent weeks.
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollLeft = viewport.current.scrollWidth;
    }
  }, [weeks]);

  // Memoized so that hovering, which only changes the tooltip label, doesn't
  // re-render every square.
  const columns = useMemo(() => {
    const colorFor = (day: Day) =>
      day.ratings.length > 0
        ? ratingColors[day.ratings[0]] ?? emptyColor
        : day.imported
          ? importColor
          : emptyColor;

    return weeks.map((week, wi) => {
      const month = week[0].date.getMonth();
      const showMonth = wi === 0 || weeks[wi - 1][0].date.getMonth() !== month;
      return (
        <Box key={wi} style={{ width: SQUARE, flexShrink: 0 }}>
          <Text
            size="10px"
            c="dimmed"
            h={14}
            style={{ whiteSpace: "nowrap", overflow: "visible" }}
          >
            {showMonth
              ? week[0].date.toLocaleDateString(undefined, {
                  month: "short",
                })
              : ""}
          </Text>
          <Box
            style={{
              display: "flex",
              flexDirection: "column",
              gap: GAP,
            }}
          >
            {week.map((day) => (
              <Box
                key={day.date.getTime()}
                w={SQUARE}
                h={SQUARE}
                onMouseEnter={() => setHovered(day)}
                style={{
                  backgroundColor: colorFor(day),
                  borderRadius: 2,
                }}
              />
            ))}
          </Box>
        </Box>
      );
    });
  }, [weeks, ratingColors, importColor, emptyColor]);

  if (weeks.length === 0) {
    return null;
  }

  const labelFor = (day: Day) => {
    const parts = day.ratings.map((r) => Score[r] ?? String(r));
    if (day.imported) {
      parts.unshift("Imported");
    }
    return `${day.date.toLocaleDateString()}: ${
      parts.length > 0 ? parts.join(", ") : "not reviewed"
    }`;
  };

  return (
    <>
      <ScrollArea viewportRef={viewport} type="auto" offsetScrollbars>
        <Tooltip.Floating
          label={hovered ? labelFor(hovered) : ""}
          disabled={!hovered}
        >
          <Box
            style={{ display: "flex", gap: GAP }}
            onMouseLeave={() => setHovered(null)}
          >
            {columns}
          </Box>
        </Tooltip.Floating>
      </ScrollArea>
      <Group gap="md" mt="xs">
        {[
          { label: "Missed", color: ratingColors[1] },
          { label: "Hard", color: ratingColors[2] },
          { label: "Good", color: ratingColors[3] },
          { label: "Easy", color: ratingColors[4] },
          { label: "Imported", color: importColor },
        ].map(({ label, color }) => (
          <Group gap={4} key={label}>
            <Box
              w={SQUARE}
              h={SQUARE}
              style={{ backgroundColor: color, borderRadius: 2 }}
            />
            <Text size="xs" c="dimmed">
              {label}
            </Text>
          </Group>
        ))}
        <Text size="xs" c="dimmed">
          (first review each day)
        </Text>
      </Group>
    </>
  );
};

export default ReviewHeatmap;

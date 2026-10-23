import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "./app_context";
import {
  GetDailyLeaderboardResponse_LeaderboardItem,
  GetWeeklyLeaderboardResponse,
} from "./gen/rpc/wordvault/api_pb";
import { notifications } from "@mantine/notifications";
import { SegmentedControl, Stack, Table, Text, Tooltip } from "@mantine/core";

// Long usernames get cut off, with the full name in a tooltip.
const MAX_USERNAME_LENGTH = 16;

const Username: React.FC<{ username: string }> = ({ username }) => {
  if (username.length <= MAX_USERNAME_LENGTH) {
    return username;
  }
  return (
    <Tooltip
      label={username}
      events={{ hover: true, focus: true, touch: true }}
    >
      <Text span inherit>
        {username.slice(0, MAX_USERNAME_LENGTH - 1)}…
      </Text>
    </Tooltip>
  );
};

// A YYYY-MM-DD leaderboard day as a short weekday, e.g. "Thu".
const weekdayLabel = (day: string): string => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
  });
};

const getTimeUntilMidnightPacific = (): string => {
  const now = new Date();
  const pacificTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
  );

  const midnightPacific = new Date(pacificTime);
  midnightPacific.setHours(24, 0, 0, 0);

  const timeDiff = midnightPacific.getTime() - pacificTime.getTime();

  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  } else if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  } else {
    return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
  }
};

const Leaderboard: React.FC = () => {
  const { jwt, wordVaultClient } = useContext(AppContext);
  const [leaderboard, setLeaderboard] = useState<
    GetDailyLeaderboardResponse_LeaderboardItem[]
  >([]);
  const [weekly, setWeekly] = useState<GetWeeklyLeaderboardResponse>();
  const [view, setView] = useState<"today" | "week">("today");
  const [timeUntilReset, setTimeUntilReset] = useState(
    getTimeUntilMidnightPacific(),
  );

  const fetchLeaderboard = useCallback(async () => {
    if (!wordVaultClient) {
      return;
    }
    try {
      const [daily, weekly] = await Promise.all([
        wordVaultClient.getDailyLeaderboard({}),
        wordVaultClient.getWeeklyLeaderboard({}),
      ]);
      setLeaderboard(daily.items);
      setWeekly(weekly);
    } catch (e) {
      notifications.show({
        color: "red",
        message: String(e),
      });
    }
  }, [wordVaultClient]);

  useEffect(() => {
    if (!jwt) {
      return;
    }
    fetchLeaderboard();
  }, [fetchLeaderboard, jwt]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntilReset(getTimeUntilMidnightPacific());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const data = useMemo(() => {
    return leaderboard.map((v) => ({
      username: v.user,
      studied: v.cardsStudied,
    }));
  }, [leaderboard]);

  const totalStats = useMemo(() => {
    return [
      leaderboard.length,
      leaderboard.reduce((total, user) => total + user.cardsStudied, 0),
    ];
  }, [leaderboard]);

  const weeklyTotalStats = useMemo(() => {
    const items = weekly?.items ?? [];
    return [
      items.length,
      items.reduce((total, user) => total + user.cardsStudied, 0),
    ];
  }, [weekly]);

  // Day columns run from today back, so today sits next to the username.
  const weekDays = useMemo(
    () =>
      (weekly?.days ?? [])
        .map((day, i) => ({ day, i }))
        .reverse()
        .map(({ day, i }, col) => ({
          day,
          i,
          label: col === 0 ? "Today" : weekdayLabel(day),
          total: (weekly?.items ?? []).reduce(
            (total, item) => total + (item.cardsStudiedByDay[i] ?? 0),
            0,
          ),
        })),
    [weekly],
  );

  const randomSaying = useMemo(() => {
    const sayings = [
      "Knowledge is power, but spaced repetition is the fuel!",
      "Study like a champion, review like a pro.",
      "Brains in motion stay in motion—keep studying!",
      "Cards today, brilliance tomorrow!",
      "Every card counts—you're closer than you think!",
      "Turning flashcards into flash victories!",
      "Consistency beats intensity—you're doing great!",
      "Keep calm and study on.",
      "Stack by stack, you're building an empire of knowledge!",
      "Cards don't study themselves, but you're doing awesome!",
      "Your future self is high-fiving you right now!",
      "Little steps lead to giant leaps in learning.",
      "Studying cards now—flexing brain muscles later.",
      "Every card mastered is a win for your brain.",
      "You're not just studying; you're leveling up!",
      "Don't stop till your brain drops (knowledge, that is)!",
      "Persistence beats resistance—crush those cards!",
      "Flashcards are temporary, but wisdom is forever.",
      "You're studying like a pro and slaying like a hero!",
      "The deck isn't stacked against you—it's stacked for you!",
    ];
    return sayings[Math.floor(Math.random() * sayings.length)];
  }, []);

  return (
    <Stack gap="lg">
      <SegmentedControl
        maw={600}
        value={view}
        onChange={(v) => setView(v as "today" | "week")}
        data={[
          { label: "Today", value: "today" },
          { label: "Last 7 days", value: "week" },
        ]}
      />
      <Text c="dimmed">
        Next reset in {timeUntilReset} (midnight US/Pacific)
      </Text>
      {view === "today" ? (
        <>
          <Text c="dimmed">
            {totalStats[0]} users have studied {totalStats[1]} cards today.{" "}
            {randomSaying}
          </Text>
          <Table maw={600}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Username</Table.Th>
                <Table.Th>Cards studied today</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.map((datum) => (
                <Table.Tr key={datum.username}>
                  <Table.Td>
                    <Username username={datum.username} />
                  </Table.Td>
                  <Table.Td>{datum.studied}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
            <Table.Tfoot>
              <Table.Tr fw={700}>
                <Table.Td>Everyone</Table.Td>
                <Table.Td>{totalStats[1]}</Table.Td>
              </Table.Tr>
            </Table.Tfoot>
          </Table>
        </>
      ) : (
        <>
          <Text c="dimmed">
            {weeklyTotalStats[0]} users have studied {weeklyTotalStats[1]} cards
            in the last 7 days. {randomSaying}
          </Text>
          <Table.ScrollContainer minWidth={600} maw={800}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Username</Table.Th>
                  {weekDays.map(({ day, label }) => (
                    <Table.Th key={day} ta="right">
                      {label}
                    </Table.Th>
                  ))}
                  <Table.Th ta="right">Total</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {weekly?.items.map((item) => (
                  <Table.Tr key={item.user}>
                    <Table.Td>
                      <Username username={item.user} />
                    </Table.Td>
                    {weekDays.map(({ day, i }) => {
                      const n = item.cardsStudiedByDay[i] ?? 0;
                      return (
                        <Table.Td
                          key={day}
                          ta="right"
                          c={n ? undefined : "dimmed"}
                        >
                          {n}
                        </Table.Td>
                      );
                    })}
                    <Table.Td ta="right" fw={700}>
                      {item.cardsStudied}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
              <Table.Tfoot>
                <Table.Tr fw={700}>
                  <Table.Td>Everyone</Table.Td>
                  {weekDays.map(({ day, total }) => (
                    <Table.Td key={day} ta="right">
                      {total}
                    </Table.Td>
                  ))}
                  <Table.Td ta="right">{weeklyTotalStats[1]}</Table.Td>
                </Table.Tr>
              </Table.Tfoot>
            </Table>
          </Table.ScrollContainer>
        </>
      )}
    </Stack>
  );
};

export default Leaderboard;

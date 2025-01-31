import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AppContext } from "./app_context";
import { GetDailyLeaderboardResponse_LeaderboardItem } from "./gen/rpc/wordvault/api_pb";
import { notifications } from "@mantine/notifications";
import { Stack, Table, Text } from "@mantine/core";

const Leaderboard: React.FC = () => {
  const { jwt, wordVaultClient } = useContext(AppContext);
  const [leaderboard, setLeaderboard] = useState<
    GetDailyLeaderboardResponse_LeaderboardItem[]
  >([]);

  const fetchLeaderboard = useCallback(async () => {
    if (!wordVaultClient) {
      return;
    }
    try {
      const resp = await wordVaultClient.getDailyLeaderboard({
        timezone: "America/Los_Angeles",
      });
      setLeaderboard(resp.items);
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
      <Text c="dimmed">Stats reset at midnight Aerolith time (US/Pacific)</Text>
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
              <Table.Td>{datum.username}</Table.Td>
              <Table.Td>{datum.studied}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Stack>
  );
};

export default Leaderboard;

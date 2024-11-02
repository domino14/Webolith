import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useClient } from "./use_client";
import { AppContext } from "./app_context";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
import { GetDailyLeaderboardResponse_LeaderboardItem } from "./gen/rpc/wordvault/api_pb";
import { notifications } from "@mantine/notifications";
import { Stack, Table, Text } from "@mantine/core";

const Leaderboard: React.FC = () => {
  const { jwt } = useContext(AppContext);
  const wordvaultClient = useClient(WordVaultService);
  const [leaderboard, setLeaderboard] = useState<
    GetDailyLeaderboardResponse_LeaderboardItem[]
  >([]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const resp = await wordvaultClient.getDailyLeaderboard({
        timezone: "America/Los_Angeles",
      });
      setLeaderboard(resp.items);
    } catch (e) {
      notifications.show({
        color: "red",
        message: String(e),
      });
    }
  }, [wordvaultClient]);

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

  return (
    <Stack gap="lg">
      <Text c="dimmed">Stats reset at midnight Aerolith time (US/Pacific)</Text>
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

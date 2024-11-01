import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useClient } from "./use_client";
import { AppContext } from "./app_context";
import { WordVaultService } from "./gen/rpc/wordvault/api_connect";
import { GetDailyLeaderboardResponse_LeaderboardItem } from "./gen/rpc/wordvault/api_pb";
import { notifications } from "@mantine/notifications";
import { BarChart } from "@mantine/charts";

const Leaderboard: React.FC = () => {
  const { jwt } = useContext(AppContext);
  const wordvaultClient = useClient(WordVaultService);
  const [leaderboard, setLeaderboard] = useState<
    GetDailyLeaderboardResponse_LeaderboardItem[]
  >([]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const resp = await wordvaultClient.getDailyLeaderboard({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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
      Studied: v.cardsStudied,
    }));
  }, [leaderboard]);
  console.log("data", data);

  return (
    <BarChart
      maw={1000}
      h={1000}
      orientation="vertical"
      mt="lg"
      data={data}
      dataKey="username"
      series={[{ name: "Studied", color: "blue.6" }]}
      tickLine="x"
    />
  );
};

export default Leaderboard;

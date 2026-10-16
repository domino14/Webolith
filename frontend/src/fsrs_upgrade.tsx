import React, { useCallback, useContext, useState } from "react";
import { Button, Loader, Modal, Stack, Table, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { AppContext } from "./app_context";
import { FsrsUpgradeSummary } from "./gen/rpc/wordvault/api_pb";
import { LATEST_FSRS_VERSION, useFsrsVersion } from "./fsrs_version";

const formatDays = (days: number) =>
  days >= 10 ? `${Math.round(days)} days` : `${days.toFixed(1)} days`;

// How the upgrade changes intervals. Due dates don't change, so this is the
// interval cards get the next time they're answered Good.
const IntervalTable: React.FC<{ summary: FsrsUpgradeSummary }> = ({
  summary,
}) => (
  <Table>
    <Table.Thead>
      <Table.Tr>
        <Table.Th></Table.Th>
        <Table.Th>FSRS-{summary.currentVersion}</Table.Th>
        <Table.Th>FSRS-{summary.targetVersion}</Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      <Table.Tr>
        <Table.Td>Typical next interval after a correct answer</Table.Td>
        <Table.Td>{formatDays(summary.medianGoodIntervalDaysBefore)}</Table.Td>
        <Table.Td>{formatDays(summary.medianGoodIntervalDaysAfter)}</Table.Td>
      </Table.Tr>
    </Table.Tbody>
  </Table>
);

// Lets a user on an older FSRS version preview and then move all their cards
// to the latest one.
const FsrsUpgrade: React.FC = () => {
  const { wordVaultClient } = useContext(AppContext);
  const [version, setVersion] = useFsrsVersion();
  const [summary, setSummary] = useState<FsrsUpgradeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpened, modalHandlers] = useDisclosure();

  const preview = useCallback(async () => {
    if (!wordVaultClient) {
      return;
    }
    try {
      setLoading(true);
      const resp = await wordVaultClient.previewFsrsUpgrade({});
      setSummary(resp.summary ?? null);
      modalHandlers.open();
    } catch (e) {
      notifications.show({ color: "red", title: "Error", message: String(e) });
    } finally {
      setLoading(false);
    }
  }, [wordVaultClient, modalHandlers]);

  const upgrade = useCallback(async () => {
    if (!wordVaultClient) {
      return;
    }
    try {
      setLoading(true);
      const resp = await wordVaultClient.upgradeFsrs({});
      const s = resp.summary;
      notifications.show({
        color: "green",
        title: `Upgraded to FSRS-${LATEST_FSRS_VERSION}`,
        message: s
          ? `Updated ${s.rescheduledCards} cards. Your due dates haven't changed.`
          : "Your cards have been updated. Your due dates haven't changed.",
      });
      setVersion(LATEST_FSRS_VERSION);
      modalHandlers.close();
    } catch (e) {
      notifications.show({ color: "red", title: "Error", message: String(e) });
    } finally {
      setLoading(false);
    }
  }, [wordVaultClient, modalHandlers, setVersion]);

  if (version === null) {
    return null;
  }
  if (version >= LATEST_FSRS_VERSION) {
    return (
      <Text size="sm" c="dimmed" mt="lg">
        Scheduler: FSRS-{version}, the latest version.
      </Text>
    );
  }

  return (
    <>
      <Modal
        opened={modalOpened}
        onClose={modalHandlers.close}
        title={`Upgrade to FSRS-${LATEST_FSRS_VERSION}`}
        size="lg"
      >
        {summary && (
          <Stack>
            <Text>
              FSRS-{LATEST_FSRS_VERSION} will recalculate how well you know
              each of your {summary.totalCards} cards, in all lexicons, from
              your review history, as if you had been using it all along.
            </Text>
            <Text>
              Your due dates stay the same, so nothing becomes due because of
              the upgrade. You have {summary.dueNowBefore} cards due now and{" "}
              {summary.dueWithinWeekBefore} due in the next 7 days, before and
              after upgrading.
            </Text>
            <Text>
              From each card's next review on, FSRS-{LATEST_FSRS_VERSION}{" "}
              schedules it. When you next answer them correctly,{" "}
              {summary.goodIntervalLonger} cards will get a longer interval
              than they would now and {summary.goodIntervalShorter} a shorter
              one. Words you've always known tend to get longer intervals,
              and words you've missed shorter ones.
            </Text>
            <IntervalTable summary={summary} />
            {(summary.unchangedCards > 0 || summary.importedCards > 0) && (
              <Text size="sm">
                {summary.unchangedCards > 0 &&
                  `${summary.unchangedCards} cards you haven't studied yet stay as they are. `}
                {summary.importedCards > 0 &&
                  `${summary.importedCards} cards imported from Cardbox keep their memory estimates.`}
              </Text>
            )}
            <Text fw={700} c="red">
              This can't be undone.
            </Text>
            <Button onClick={upgrade} loading={loading}>
              Upgrade to FSRS-{LATEST_FSRS_VERSION}
            </Button>
          </Stack>
        )}
      </Modal>

      <Text mt="lg">
        Your cards are scheduled with FSRS-{version}. FSRS-
        {LATEST_FSRS_VERSION} is a newer version of the scheduling algorithm
        that predicts more accurately when you'll forget a word.
      </Text>
      <Button
        variant="light"
        mt="sm"
        onClick={preview}
        disabled={loading}
        leftSection={loading && !modalOpened ? <Loader size="xs" /> : null}
      >
        See what upgrading would change
      </Button>
    </>
  );
};

export default FsrsUpgrade;

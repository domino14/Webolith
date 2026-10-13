import React, { useCallback, useContext, useEffect, useState } from "react";
import { Button, Loader, Modal, Stack, Table, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { AppContext } from "./app_context";
import { FsrsUpgradeSummary } from "./gen/rpc/wordvault/api_pb";

const LATEST_FSRS_VERSION = 6;

const formatDays = (days: number) =>
  days >= 10 ? `${Math.round(days)} days` : `${days.toFixed(1)} days`;

const SummaryTable: React.FC<{ summary: FsrsUpgradeSummary }> = ({
  summary,
}) => (
  <Table>
    <Table.Thead>
      <Table.Tr>
        <Table.Th></Table.Th>
        <Table.Th>Now</Table.Th>
        <Table.Th>After upgrade</Table.Th>
      </Table.Tr>
    </Table.Thead>
    <Table.Tbody>
      <Table.Tr>
        <Table.Td>Due now</Table.Td>
        <Table.Td>{summary.dueNowBefore}</Table.Td>
        <Table.Td>{summary.dueNowAfter}</Table.Td>
      </Table.Tr>
      <Table.Tr>
        <Table.Td>Due in the next 7 days</Table.Td>
        <Table.Td>{summary.dueWithinWeekBefore}</Table.Td>
        <Table.Td>{summary.dueWithinWeekAfter}</Table.Td>
      </Table.Tr>
      <Table.Tr>
        <Table.Td>Due in the next 30 days</Table.Td>
        <Table.Td>{summary.dueWithinMonthBefore}</Table.Td>
        <Table.Td>{summary.dueWithinMonthAfter}</Table.Td>
      </Table.Tr>
      <Table.Tr>
        <Table.Td>Typical interval</Table.Td>
        <Table.Td>{formatDays(summary.medianIntervalDaysBefore)}</Table.Td>
        <Table.Td>{formatDays(summary.medianIntervalDaysAfter)}</Table.Td>
      </Table.Tr>
    </Table.Tbody>
  </Table>
);

// Lets a user on an older FSRS version preview and then move all their cards
// to the latest one.
const FsrsUpgrade: React.FC = () => {
  const { wordVaultClient } = useContext(AppContext);
  const [version, setVersion] = useState<number | null>(null);
  const [summary, setSummary] = useState<FsrsUpgradeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpened, modalHandlers] = useDisclosure();

  useEffect(() => {
    if (!wordVaultClient) {
      return;
    }
    wordVaultClient
      .getFsrsParameters({})
      .then((resp) => setVersion(resp.fsrsVersion))
      .catch((e) => console.error("Error fetching FSRS version:", e));
  }, [wordVaultClient]);

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
          ? `Rescheduled ${s.rescheduledCards + s.importedCards} cards. ${s.dueNowAfter} are due now.`
          : "Your cards have been rescheduled.",
      });
      setVersion(LATEST_FSRS_VERSION);
      modalHandlers.close();
    } catch (e) {
      notifications.show({ color: "red", title: "Error", message: String(e) });
    } finally {
      setLoading(false);
    }
  }, [wordVaultClient, modalHandlers]);

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
              Your {summary.totalCards} cards, in all lexicons, will be
              rescheduled as if you had been using FSRS-
              {LATEST_FSRS_VERSION} all along, based on your review history.
              Cards that end up overdue become due now.
            </Text>
            <SummaryTable summary={summary} />
            <Text size="sm">
              {summary.movedEarlier} cards move earlier and{" "}
              {summary.movedLater} move later by a day or more.{" "}
              {summary.unchangedCards > 0 &&
                `${summary.unchangedCards} cards you haven't studied yet stay as they are. `}
              {summary.importedCards > 0 &&
                `${summary.importedCards} cards imported from Cardbox keep their memory estimates and only get new due dates.`}
            </Text>
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

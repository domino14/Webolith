import {
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useCallback, useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppContext } from "../app_context";
import {
  GetStudyPlanProgressResponse,
  StudyPlan,
  StudyPlanBatch,
  StudyPlanStage,
} from "../gen/rpc/wordvault/api_pb";
import { describeSearchParam } from "../search/types";
import {
  batchDetail,
  batchRuleLabel,
  batchTitle,
  deckName,
  fmt,
  notifyPlanError,
  stageName,
} from "./common";
import { ProgressLegend, ProgressStrip } from "./progress_strip";

export const StageChips = ({ stage }: { stage: StudyPlanStage }) => (
  <Group gap={6}>
    {stage.searchParams.map((p, i) => (
      <Badge key={i} variant="light" tt="none">
        {describeSearchParam(p)}
      </Badge>
    ))}
    <Text size="xs" c="dimmed">
      Probability, {stage.descending ? "high to low" : "low to high"}
    </Text>
  </Group>
);

const BatchPreview = ({
  plan,
  batch,
  opened,
  onClose,
}: {
  plan: StudyPlan;
  batch: StudyPlanBatch;
  opened: boolean;
  onClose: () => void;
}) => (
  <Modal opened={opened} onClose={onClose} title={batchTitle(plan, batch)}>
    <ScrollArea.Autosize mah="60vh">
      <Table striped>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Alphagram</Table.Th>
            <Table.Th>Stage</Table.Th>
            <Table.Th ta="right">Probability</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {batch.items.map((it) => (
            <Table.Tr key={it.alphagram}>
              <Table.Td ff="monospace">{it.alphagram}</Table.Td>
              <Table.Td>{stageName(plan.stages[it.stage], it.stage)}</Table.Td>
              <Table.Td ta="right">{fmt(it.sortValue)}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea.Autosize>
  </Modal>
);

const StudyPlanPage = () => {
  const { id } = useParams();
  const { wordVaultClient, decksById } = useContext(AppContext);
  const [plan, setPlan] = useState<StudyPlan | null>();
  const [progress, setProgress] = useState<GetStudyPlanProgressResponse>();
  const [adding, setAdding] = useState(false);
  const [previewOpened, preview] = useDisclosure();

  useEffect(() => {
    if (!wordVaultClient) {
      return;
    }
    wordVaultClient
      .getStudyPlans({})
      .then((resp) =>
        setPlan(resp.plans.find((p) => String(p.id) === id) ?? null)
      )
      .catch(notifyPlanError);
  }, [wordVaultClient, id]);

  const fetchProgress = useCallback(async () => {
    if (!wordVaultClient || !plan) {
      return;
    }
    try {
      setProgress(
        await wordVaultClient.getStudyPlanProgress({
          which: { case: "planId", value: plan.id },
        })
      );
    } catch (e) {
      notifyPlanError(e);
    }
  }, [wordVaultClient, plan]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const addBatch = async () => {
    if (!wordVaultClient || !plan) {
      return;
    }
    setAdding(true);
    try {
      const resp = await wordVaultClient.addStudyPlanBatch({ planId: plan.id });
      notifications.show({
        color: "green",
        title: `Added ${fmt(resp.numCardsAdded)} cards to ${deckName(
          plan.deckId,
          decksById
        )}`,
        message: resp.batch ? batchTitle(plan, resp.batch) : undefined,
      });
      await fetchProgress();
    } catch (e) {
      notifyPlanError(e);
    } finally {
      setAdding(false);
    }
  };

  if (plan === null) {
    return <Text>This study plan doesn't exist.</Text>;
  }
  if (!plan) {
    return <Loader />;
  }
  const next = progress?.nextBatch;

  return (
    <Stack maw={960} gap="xl">
      <Group justify="space-between" align="flex-start">
        <Stack gap={6}>
          <Text size="sm" c="dimmed">
            <Link to="/study-plans" style={{ color: "inherit" }}>
              Study plans
            </Link>{" "}
            / {plan.name}
          </Text>
          <Title order={2}>{plan.name}</Title>
          <Group gap={6}>
            <Badge variant="default">{plan.lexicon}</Badge>
            <Badge variant="default">{deckName(plan.deckId, decksById)}</Badge>
            <Badge variant="default">{batchRuleLabel(plan)}</Badge>
          </Group>
        </Stack>
        <Button
          variant="default"
          component={Link}
          to={`/study-plans/${plan.id}/edit`}
        >
          Edit plan
        </Button>
      </Group>

      {progress ? (
        <>
          <Card withBorder padding="lg">
            <Group justify="space-between" wrap="wrap" gap="lg">
              <Stack gap={4} style={{ minWidth: 0, flex: "1 1 320px" }}>
                <Text size="xs" fw={700} tt="uppercase" c="yellow">
                  Next batch
                </Text>
                <Text size="xl" fw={700}>
                  {next ? batchTitle(plan, next) : "You've finished this plan"}
                </Text>
                <Text c="dimmed">
                  {next
                    ? batchDetail(next)
                    : "Every word in every stage is in your vault."}
                </Text>
              </Stack>
              {next && (
                <Group>
                  <Button variant="default" size="md" onClick={preview.open}>
                    Preview words
                  </Button>
                  <Button size="md" onClick={addBatch} loading={adding}>
                    Add {fmt(next.items.length)} cards
                  </Button>
                </Group>
              )}
            </Group>
          </Card>
          {next && (
            <BatchPreview
              plan={plan}
              batch={next}
              opened={previewOpened}
              onClose={preview.close}
            />
          )}

          <Stack gap="md">
            <Group justify="space-between">
              <Title order={3}>Progress</Title>
              <Text c="dimmed">
                {fmt(progress.added)} of {fmt(progress.total)} words ·{" "}
                {progress.total
                  ? Math.floor((100 * progress.added) / progress.total)
                  : 0}
                %
              </Text>
            </Group>
            {progress.stages.map((sp, i) => {
              const stage = plan.stages[i];
              const done = sp.added === sp.total;
              const nextHere = next?.items.find((it) => it.stage === i);
              return (
                <Stack key={i} gap={6}>
                  <Group justify="space-between" wrap="nowrap">
                    <Text fw={600} truncate>
                      <Text span c="dimmed">
                        {i + 1}.
                      </Text>{" "}
                      {stageName(stage, i)}
                    </Text>
                    <Text size="sm" style={{ whiteSpace: "nowrap" }}>
                      {fmt(sp.added)} / {fmt(sp.total)} ·{" "}
                      <Text
                        span
                        size="sm"
                        c={done ? "blue" : sp.doneThrough ? "yellow" : "dimmed"}
                      >
                        {done
                          ? "Complete"
                          : sp.doneThrough !== undefined
                          ? `Done through ${fmt(sp.doneThrough)}`
                          : sp.added > 0
                          ? "Started"
                          : "Not started"}
                      </Text>
                    </Text>
                  </Group>
                  <StageChips stage={stage} />
                  <ProgressStrip
                    blocks={sp.blocks}
                    descending={stage.descending}
                    nextValue={nextHere?.sortValue}
                  />
                </Stack>
              );
            })}
            <Text size="xs" c="dimmed">
              Probability. Each block is {fmt(progress.blockSize)} wide, or
              more for long stages.
            </Text>
            <ProgressLegend />
          </Stack>
        </>
      ) : (
        <Loader />
      )}
    </Stack>
  );
};

export default StudyPlanPage;

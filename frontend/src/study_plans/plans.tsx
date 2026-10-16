import {
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Progress,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../app_context";
import {
  GetStudyPlanProgressResponse,
  StudyPlan,
} from "../gen/rpc/wordvault/api_pb";
import {
  batchRuleLabel,
  batchTitle,
  deckName,
  fmt,
  notifyPlanError,
} from "./common";

// Big enough that each stage comes back as one block; the list only shows
// totals.
const SUMMARY_BLOCK_SIZE = 1_000_000;

const PlanCard = ({ plan }: { plan: StudyPlan }) => {
  const { wordVaultClient, decksById } = useContext(AppContext);
  const [progress, setProgress] = useState<GetStudyPlanProgressResponse>();

  useEffect(() => {
    if (!wordVaultClient) {
      return;
    }
    wordVaultClient
      .getStudyPlanProgress({
        which: { case: "planId", value: plan.id },
        blockSize: SUMMARY_BLOCK_SIZE,
      })
      .then(setProgress)
      .catch(notifyPlanError);
  }, [wordVaultClient, plan.id]);

  const pct = progress?.total ? (100 * progress.added) / progress.total : 0;

  return (
    <Card withBorder padding="lg" component={Link} to={`/study-plans/${plan.id}`}>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Text fw={700} size="lg" truncate>
            {plan.name}
          </Text>
          <Group gap={6}>
            <Badge variant="default">{deckName(plan.deckId, decksById)}</Badge>
            <Badge variant="default">{batchRuleLabel(plan)}</Badge>
          </Group>
        </Group>
        {progress ? (
          <>
            <Progress value={pct} />
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {fmt(progress.added)} of {fmt(progress.total)} words ·{" "}
                {Math.floor(pct)}%
              </Text>
              <Text size="sm" c={progress.nextBatch ? "yellow" : "blue"}>
                {progress.nextBatch
                  ? `Next: ${batchTitle(plan, progress.nextBatch)}`
                  : "Complete"}
              </Text>
            </Group>
          </>
        ) : (
          <Loader size="sm" type="dots" />
        )}
      </Stack>
    </Card>
  );
};

const StudyPlans = () => {
  const { wordVaultClient, lexicon } = useContext(AppContext);
  const [plans, setPlans] = useState<StudyPlan[]>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!wordVaultClient) {
      return;
    }
    wordVaultClient
      .getStudyPlans({})
      .then((resp) => setPlans(resp.plans))
      .catch(notifyPlanError);
  }, [wordVaultClient]);

  const lexPlans = plans?.filter((p) => p.lexicon === lexicon);

  return (
    <Stack maw={860} gap="lg">
      <Group justify="space-between">
        <Title order={2}>Study plans</Title>
        <Button
          leftSection={<IconPlus />}
          onClick={() => navigate("/study-plans/new")}
        >
          New plan
        </Button>
      </Group>
      <Text c="dimmed">
        A plan is a list of searches that WordVault works through in order. Each
        time you press <b>Add next batch</b>, it adds the next cards you don't
        have yet. Your progress is whatever is already in your vault, so a plan
        picks up where you are, even with cards you added before making it.
      </Text>
      {lexPlans === undefined ? (
        <Loader />
      ) : lexPlans.length === 0 ? (
        <Text>You don't have any study plans for {lexicon} yet.</Text>
      ) : (
        lexPlans.map((p) => <PlanCard key={String(p.id)} plan={p} />)
      )}
    </Stack>
  );
};

export default StudyPlans;

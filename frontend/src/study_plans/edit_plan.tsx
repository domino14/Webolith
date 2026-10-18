import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Modal,
  NumberInput,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconArrowDown,
  IconArrowUp,
  IconCopy,
  IconInfoCircle,
  IconTrash,
} from "@tabler/icons-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConnectError } from "@connectrpc/connect";
import { AppContext } from "../app_context";
import {
  GetStudyPlanProgressResponse,
  StudyPlan,
  StudyPlanBatchUnit,
  StudyPlanSortField,
  StudyPlanStage,
} from "../gen/rpc/wordvault/api_pb";
import { SearchRequest_SearchParam } from "../gen/rpc/wordsearcher/searcher_pb";
import DeckSelector from "../search/DeckSelector";
import SearchRows from "../search/rows";
import {
  criterionFromProto,
  describeSearchParam,
  optionType,
  SearchCriterion,
  searchCriterionToAdd,
  SearchTypesEnum,
} from "../search/types";
import { maybeReorderCriteria } from "../search/use_search_rows";
import {
  batchDetail,
  batchTitle,
  deckName,
  fmt,
  notifyPlanError,
  orderLabel,
  stageName,
} from "./common";

const allowedSearchTypes = new Set([
  SearchTypesEnum.PROBABILITY,
  SearchTypesEnum.LENGTH,
  SearchTypesEnum.POINTS,
  SearchTypesEnum.NUM_ANAGRAMS,
  SearchTypesEnum.NUM_VOWELS,
  SearchTypesEnum.NOT_IN_LEXICON,
  SearchTypesEnum.DIFFICULTY_RANGE,
  SearchTypesEnum.PLAYABILITY_RANGE,
  SearchTypesEnum.PROBABILITY_LIMIT,
  SearchTypesEnum.MATCHING_ANAGRAM,
  SearchTypesEnum.CONTAINS_HOOKS,
  SearchTypesEnum.DEFINITION_CONTAINS,
]);

type StageState = {
  name: string;
  criteria: SearchCriterion[];
  // Conditions the editor can't show, such as uploaded lists. They're kept
  // as they are, after the others.
  extra: SearchRequest_SearchParam[];
  sortField: StudyPlanSortField;
  descending: boolean;
};

const newStage = (): StageState => ({
  name: "",
  criteria: [
    new SearchCriterion(SearchTypesEnum.LENGTH, { minValue: 7, maxValue: 7 }),
  ],
  extra: [],
  sortField: StudyPlanSortField.STUDY_PLAN_SORT_PROBABILITY,
  descending: false,
});

const copyStage = (s: StageState): StageState => ({
  ...s,
  criteria: s.criteria.map((c) => c.deepCopy()),
  extra: [...s.extra],
});

const stageFromProto = (st: StudyPlanStage): StageState => {
  const criteria: SearchCriterion[] = [];
  const extra: SearchRequest_SearchParam[] = [];
  st.searchParams.forEach((p) => {
    const c = criterionFromProto(p);
    if (c) {
      criteria.push(c);
    } else {
      extra.push(p);
    }
  });
  return {
    name: st.name,
    criteria,
    extra,
    sortField: st.sortField,
    descending: st.descending,
  };
};

const stageToProto = (s: StageState) =>
  new StudyPlanStage({
    name: s.name.trim(),
    searchParams: [...s.criteria.map((c) => c.toProtoObj()), ...s.extra],
    sortField: s.sortField,
    descending: s.descending,
  });

// The order Select's values are "<sort field>-asc" or "<sort field>-desc".
const orderOptions = [
  StudyPlanSortField.STUDY_PLAN_SORT_PROBABILITY,
  StudyPlanSortField.STUDY_PLAN_SORT_PLAYABILITY,
].flatMap((field) =>
  [false, true].map((descending) => ({
    value: `${field}-${descending ? "desc" : "asc"}`,
    label: orderLabel(new StudyPlanStage({ sortField: field, descending })),
  }))
);

const EditStudyPlan = () => {
  const { id } = useParams();
  const isNew = id === undefined;
  const navigate = useNavigate();
  const { wordVaultClient, lexicon: currentLexicon, decksById } =
    useContext(AppContext);

  const [loaded, setLoaded] = useState<StudyPlan | null>();
  const [name, setName] = useState("");
  const [stages, setStages] = useState<StageState[]>([newStage()]);
  const [openStage, setOpenStage] = useState(0);
  const [batchUnit, setBatchUnit] = useState(
    StudyPlanBatchUnit.STUDY_PLAN_BATCH_WINDOW
  );
  const [batchSize, setBatchSize] = useState<number | string>(500);
  const [deckId, setDeckId] = useState(0n);
  const [saving, setSaving] = useState(false);
  const [deleteOpened, deleteModal] = useDisclosure();

  useEffect(() => {
    if (isNew || !wordVaultClient) {
      return;
    }
    wordVaultClient
      .getStudyPlans({})
      .then((resp) => {
        const p = resp.plans.find((p) => String(p.id) === id) ?? null;
        setLoaded(p);
        if (p) {
          setName(p.name);
          setStages(p.stages.map(stageFromProto));
          setOpenStage(-1);
          setBatchUnit(p.batchUnit);
          setBatchSize(p.batchSize);
          setDeckId(p.deckId);
        }
      })
      .catch(notifyPlanError);
  }, [isNew, id, wordVaultClient]);

  const lexicon = loaded?.lexicon ?? currentLexicon;

  const plan = useMemo(
    () =>
      new StudyPlan({
        id: loaded?.id ?? 0n,
        lexicon,
        name: name.trim(),
        deckId,
        stages: stages.map(stageToProto),
        batchUnit,
        batchSize: Number(batchSize) || 0,
      }),
    [loaded, lexicon, name, deckId, stages, batchUnit, batchSize]
  );

  // Preview the plan against the vault as it's edited.
  const [debouncedPlan] = useDebouncedValue(plan, 600);
  const [preview, setPreview] = useState<GetStudyPlanProgressResponse>();
  const [previewError, setPreviewError] = useState("");
  useEffect(() => {
    if (!wordVaultClient || !debouncedPlan.lexicon) {
      return;
    }
    let cancelled = false;
    wordVaultClient
      .getStudyPlanProgress({
        which: { case: "plan", value: debouncedPlan },
        blockSize: 1_000_000,
        includeDeckCounts: true,
      })
      .then((resp) => {
        if (!cancelled) {
          setPreview(resp);
          setPreviewError("");
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setPreview(undefined);
          setPreviewError(e instanceof ConnectError ? e.rawMessage : String(e));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [wordVaultClient, debouncedPlan]);

  const updateStage = (idx: number, f: (s: StageState) => StageState) =>
    setStages((ss) => ss.map((s, i) => (i === idx ? f(copyStage(s)) : s)));

  const moveStage = (idx: number, by: number) => {
    const to = idx + by;
    if (to < 0 || to >= stages.length) {
      return;
    }
    const ss = [...stages];
    [ss[idx], ss[to]] = [ss[to], ss[idx]];
    setStages(ss);
    if (openStage === idx) {
      setOpenStage(to);
    } else if (openStage === to) {
      setOpenStage(idx);
    }
  };

  const save = async () => {
    if (!wordVaultClient) {
      return;
    }
    setSaving(true);
    try {
      if (isNew) {
        const resp = await wordVaultClient.addStudyPlan({ plan });
        navigate(`/study-plans/${resp.plan?.id}`);
      } else {
        await wordVaultClient.editStudyPlan({ plan });
        navigate(`/study-plans/${plan.id}`);
      }
    } catch (e) {
      notifyPlanError(e);
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async () => {
    if (!wordVaultClient || !loaded) {
      return;
    }
    try {
      await wordVaultClient.deleteStudyPlan({ id: loaded.id });
      notifications.show({
        color: "green",
        message: `Deleted ${loaded.name}. Its cards stay in your vault.`,
      });
      navigate("/study-plans");
    } catch (e) {
      notifyPlanError(e);
    }
  };

  if (!isNew && loaded === undefined) {
    return <Loader />;
  }
  if (!isNew && loaded === null) {
    return <Text>This study plan doesn't exist.</Text>;
  }

  const isWindow = batchUnit === StudyPlanBatchUnit.STUDY_PLAN_BATCH_WINDOW;
  const size = Number(batchSize) || 0;

  return (
    <Stack maw={900} gap="xl">
      <Stack gap={4}>
        <Text size="sm" c="dimmed">
          <Link to="/study-plans" style={{ color: "inherit" }}>
            Study plans
          </Link>{" "}
          / {isNew ? "New plan" : loaded?.name}
        </Text>
        <Title order={2}>{isNew ? "New study plan" : "Edit study plan"}</Title>
        <Text c="dimmed" maw={640}>
          A plan is a list of searches. WordVault works through them in order
          and remembers nothing else: what's done is whatever is already in your
          vault, in any deck.
        </Text>
      </Stack>

      <Group grow align="flex-start">
        <TextInput
          label="Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="7s & 8s by difficulty"
          size="md"
          maxLength={100}
        />
        <TextInput label="Lexicon" value={lexicon} readOnly size="md" />
      </Group>

      <Stack gap="sm">
        <Group justify="space-between" align="baseline">
          <Title order={3}>Stages</Title>
          <Text size="sm" c="dimmed">
            Worked through top to bottom. An alphagram belongs to the first stage it
            matches.
          </Text>
        </Group>

        {stages.map((stage, idx) => {
          const count = preview?.stages[idx]?.total;
          const open = openStage === idx;
          const proto = stageToProto(stage);
          return (
            <Card
              key={idx}
              withBorder
              padding="md"
              style={
                open
                  ? { borderColor: "var(--mantine-color-blue-7)" }
                  : undefined
              }
            >
              <Group justify="space-between" wrap="nowrap" gap="sm">
                <Group
                  gap="sm"
                  style={{ cursor: open ? undefined : "pointer", flex: 1 }}
                  onClick={() => setOpenStage(idx)}
                >
                  <Badge circle size="lg">
                    {idx + 1}
                  </Badge>
                  {open ? (
                    <TextInput
                      aria-label="Stage name"
                      placeholder={`Stage ${idx + 1}`}
                      value={stage.name}
                      onChange={(e) => {
                        const v = e.currentTarget.value;
                        updateStage(idx, (s) => ({ ...s, name: v }));
                      }}
                      maxLength={100}
                    />
                  ) : (
                    <>
                      <Text fw={600}>{stageName(proto, idx)}</Text>
                      {proto.searchParams.map((p, i) => (
                        <Badge key={i} variant="light" tt="none">
                          {describeSearchParam(p)}
                        </Badge>
                      ))}
                      <Text size="xs" c="dimmed">
                        {orderLabel(proto)}
                      </Text>
                    </>
                  )}
                </Group>
                <Group gap={4} wrap="nowrap">
                  {count !== undefined && (
                    <Text size="sm" c="dimmed" mr="xs">
                      {fmt(count)} alphagrams
                    </Text>
                  )}
                  <Tooltip label="Move up">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      disabled={idx === 0}
                      onClick={() => moveStage(idx, -1)}
                      aria-label="Move stage up"
                    >
                      <IconArrowUp size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Move down">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      disabled={idx === stages.length - 1}
                      onClick={() => moveStage(idx, 1)}
                      aria-label="Move stage down"
                    >
                      <IconArrowDown size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Copy as a new stage">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      onClick={() => {
                        const ss = [...stages];
                        ss.splice(idx + 1, 0, {
                          ...copyStage(stage),
                          name: "",
                        });
                        setStages(ss);
                        setOpenStage(idx + 1);
                      }}
                      aria-label="Copy stage"
                    >
                      <IconCopy size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Remove stage">
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      disabled={stages.length === 1}
                      onClick={() => {
                        setStages(stages.filter((_, i) => i !== idx));
                        setOpenStage(-1);
                      }}
                      aria-label="Remove stage"
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>

              {open && (
                <Stack mt="md" gap="xs">
                  <SearchRows
                    criteria={stage.criteria}
                    allowedSearchTypes={allowedSearchTypes}
                    addSearchRow={() =>
                      updateStage(idx, (s) => {
                        const toAdd = searchCriterionToAdd(
                          s.criteria,
                          allowedSearchTypes
                        );
                        return toAdd
                          ? {
                              ...s,
                              criteria: maybeReorderCriteria([
                                ...s.criteria,
                                toAdd,
                              ]),
                            }
                          : s;
                      })
                    }
                    removeSearchRow={(ci) =>
                      updateStage(idx, (s) => ({
                        ...s,
                        criteria: s.criteria.filter((_, i) => i !== ci),
                      }))
                    }
                    modifySearchType={(ci, value) =>
                      updateStage(idx, (s) => {
                        s.criteria[ci].resetSearchType(
                          parseInt(String(value), 10)
                        );
                        return {
                          ...s,
                          criteria: maybeReorderCriteria(s.criteria),
                        };
                      })
                    }
                    modifySearchParam={(
                      ci: number,
                      paramName: string,
                      paramValue: optionType
                    ) =>
                      updateStage(idx, (s) => {
                        s.criteria[ci].setOption(paramName, paramValue);
                        return s;
                      })
                    }
                  />
                  {stage.extra.length > 0 && (
                    <Group gap={6}>
                      {stage.extra.map((p, i) => (
                        <Badge key={i} variant="light" tt="none">
                          {describeSearchParam(p)}
                        </Badge>
                      ))}
                      <Text size="xs" c="dimmed">
                        These conditions can't be edited here.
                      </Text>
                    </Group>
                  )}
                  <Select
                    label="Order"
                    data={orderOptions}
                    value={`${stage.sortField}-${
                      stage.descending ? "desc" : "asc"
                    }`}
                    onChange={(v) => {
                      if (!v) {
                        return;
                      }
                      const [field, dir] = v.split("-");
                      updateStage(idx, (s) => ({
                        ...s,
                        sortField: Number(field),
                        descending: dir === "desc",
                      }));
                    }}
                    allowDeselect={false}
                    maw={300}
                  />
                </Stack>
              )}
            </Card>
          );
        })}

        <Group>
          <Button
            variant="default"
            onClick={() => {
              setStages([...stages, newStage()]);
              setOpenStage(stages.length);
            }}
          >
            + Add stage
          </Button>
        </Group>
      </Stack>

      <Stack gap="sm">
        <Title order={3}>Batches</Title>
        <SegmentedControl
          style={{ alignSelf: "flex-start" }}
          value={String(batchUnit)}
          onChange={(v) => setBatchUnit(Number(v))}
          data={[
            {
              value: String(StudyPlanBatchUnit.STUDY_PLAN_BATCH_WINDOW),
              label: "Window",
            },
            {
              value: String(StudyPlanBatchUnit.STUDY_PLAN_BATCH_CARDS),
              label: "Number of cards",
            },
          ]}
        />
        <NumberInput
          label={isWindow ? "Window size" : "Cards per batch"}
          value={batchSize}
          onChange={setBatchSize}
          min={1}
          max={isWindow ? undefined : 1000}
          allowDecimal={false}
          allowNegative={false}
          thousandSeparator=","
          maw={200}
        />
        <Text size="sm" c="dimmed" maw={640}>
          {isWindow
            ? `Each "Add next batch" adds every missing alphagram in one block of the current stage's order (probability or playability): 1–${fmt(
                size
              )}, then ${fmt(size + 1)}–${fmt(
                2 * size
              )}, and so on. When a stage is done, the next press starts the next stage.`
            : `Each "Add next batch" adds the next ${fmt(
                size
              )} alphagrams you don't have, in plan order. A batch can run into the next stage.`}
        </Text>
      </Stack>

      <Stack gap="sm">
        <Title order={3}>Deck</Title>
        {decksById.size > 0 ? (
          <DeckSelector
            label="New cards go to"
            value={{ deckId }}
            onSelect={(v) => setDeckId("deckId" in v ? v.deckId : 0n)}
            size="md"
            minWidth={300}
          />
        ) : (
          <Text>New cards go to your default deck.</Text>
        )}
      </Stack>

      {previewError ? (
        <Alert color="red" icon={<IconInfoCircle />}>
          {previewError}
        </Alert>
      ) : preview ? (
        <Alert color="blue" icon={<IconInfoCircle />}>
          <Stack gap={6}>
            <Text>
              <b>
                {fmt(preview.added)} of {fmt(preview.total)} alphagrams in this plan
                are already in your vault.
              </b>{" "}
              Nothing is copied or moved; progress is read from your vault
              every time.
            </Text>
            {preview.deckCounts && preview.deckCounts.cardsInDeck > 0 && (
              <Text size="sm">
                {deckName(deckId, decksById)} has{" "}
                {fmt(preview.deckCounts.cardsInDeck)} cards;{" "}
                {fmt(preview.deckCounts.cardsInDeckInPlan)} of them are in this
                plan.
              </Text>
            )}
            <Text size="sm">
              {preview.nextBatch ? (
                <>
                  <b>First batch:</b> {batchTitle(plan, preview.nextBatch)}.{" "}
                  {batchDetail(preview.nextBatch)}
                </>
              ) : (
                "Everything in this plan is already in your vault."
              )}
            </Text>
          </Stack>
        </Alert>
      ) : null}

      <Group
        justify="space-between"
        pt="lg"
        style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
      >
        <div>
          {!isNew && (
            <Button variant="subtle" color="red" onClick={deleteModal.open}>
              Delete plan
            </Button>
          )}
        </div>
        <Group>
          <Button
            variant="default"
            component={Link}
            to={isNew ? "/study-plans" : `/study-plans/${id}`}
          >
            Cancel
          </Button>
          <Button onClick={save} loading={saving} disabled={!name.trim()}>
            Save plan
          </Button>
        </Group>
      </Group>

      <Modal
        opened={deleteOpened}
        onClose={deleteModal.close}
        title="Delete this plan?"
      >
        <Stack>
          <Text>
            The cards it added stay in your vault and keep their schedules.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={deleteModal.close}>
              Cancel
            </Button>
            <Button color="red" onClick={deletePlan}>
              Delete plan
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default EditStudyPlan;

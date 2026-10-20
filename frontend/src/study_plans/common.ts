import { ConnectError } from "@connectrpc/connect";
import { notifications } from "@mantine/notifications";
import {
  Deck,
  StudyPlan,
  StudyPlanBatch,
  StudyPlanBatchUnit,
  StudyPlanSortField,
  StudyPlanStage,
} from "../gen/rpc/wordvault/api_pb";

export const fmt = (n: number) => n.toLocaleString("en-US");

export const stageName = (stage: StudyPlanStage | undefined, idx: number) =>
  stage?.name || `Stage ${idx + 1}`;

// The name of the rank a stage is ordered by, e.g. "Probability".
export const sortFieldName = (field: StudyPlanSortField | undefined) =>
  field === StudyPlanSortField.STUDY_PLAN_SORT_PLAYABILITY
    ? "Playability"
    : "Probability";

// "Probability, low to high"
export const orderLabel = (stage: StudyPlanStage) =>
  `${sortFieldName(stage.sortField)}, ${
    stage.descending ? "high to low" : "low to high"
  }`;

export const deckName = (deckId: bigint, decksById: Map<bigint, Deck>) =>
  deckId === 0n
    ? "Default deck"
    : decksById.get(deckId)?.name ?? "Unknown deck";

export const batchRuleLabel = (plan: StudyPlan) =>
  plan.batchUnit === StudyPlanBatchUnit.STUDY_PLAN_BATCH_WINDOW
    ? `${fmt(plan.batchSize)}-wide windows`
    : `${fmt(plan.batchSize)} cards at a time`;

// "99 7s and 123 8s"
export const countByLength = (batch: StudyPlanBatch) => {
  const counts = new Map<number, number>();
  batch.items.forEach((it) =>
    counts.set(it.length, (counts.get(it.length) ?? 0) + 1)
  );
  const parts = [...counts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([len, n]) => `${fmt(n)} ${len}s`);
  if (parts.length <= 1) {
    return parts.join("");
  }
  return parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
};

// A one-line title for a batch, e.g. "Medium · Probability 3,501–4,000".
export const batchTitle = (plan: StudyPlan, batch: StudyPlanBatch) => {
  const n = batch.numMissingInWindow;
  if (batch.gaps) {
    return `Fill in ${fmt(n)} ${n === 1 ? "gap" : "gaps"}`;
  }
  const stage = stageName(plan.stages[batch.stage], batch.stage);
  if (plan.batchUnit === StudyPlanBatchUnit.STUDY_PLAN_BATCH_WINDOW) {
    const field = sortFieldName(plan.stages[batch.stage]?.sortField);
    return `${stage} · ${field} ${fmt(batch.windowLo)}–${fmt(
      batch.windowHi
    )}`;
  }
  const stages = new Set(batch.items.map((it) => it.stage));
  if (stages.size > 1) {
    const last = Math.max(...stages);
    return `${stage} to ${stageName(plan.stages[last], last)}`;
  }
  return stage;
};

export const batchDetail = (batch: StudyPlanBatch) => {
  const lines = [`${countByLength(batch)}.`];
  if (batch.gaps) {
    lines.unshift(
      "Cards missing from ranges you've already finished, such as words added in a new lexicon."
    );
  }
  if (batch.numMissingInWindow > batch.items.length) {
    lines.push(
      `${fmt(batch.items.length)} of ${fmt(
        batch.numMissingInWindow
      )} now; the rest come in the next batch.`
    );
  }
  return lines.join(" ");
};

export const notifyPlanError = (e: unknown) => {
  const message = e instanceof ConnectError ? e.rawMessage : String(e);
  notifications.show({ color: "red", title: "Error", message });
};

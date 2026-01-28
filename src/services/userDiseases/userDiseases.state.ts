import type { UserStepState, UserStepStateCode } from "./userDiseases.types";

export const STEP_STATE_VALUES = ["pending", "active", "completed"] as const;
export type StepStateValue = (typeof STEP_STATE_VALUES)[number];

export function normalizeStepStateValue(
  state: UserStepState | null | undefined
): StepStateValue {
  const normalized = String(state ?? "").toLowerCase();
  return STEP_STATE_VALUES.includes(normalized as StepStateValue)
    ? (normalized as StepStateValue)
    : "pending";
}

export function stepStateToCode(
  state: UserStepState | null | undefined
): UserStepStateCode {
  const normalized = normalizeStepStateValue(state);
  if (normalized === "active") return 1;
  if (normalized === "completed") return 2;
  return 0;
}

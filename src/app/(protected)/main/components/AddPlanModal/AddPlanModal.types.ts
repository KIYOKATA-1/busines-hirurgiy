import { IDiseaseListEntry } from "@/services/disease/disease.types";

export type Props = {
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void | Promise<void>;
  entries: IDiseaseListEntry[];
};

export type StepDraft = {
  key: string;
  orderNo: number;
  title: string;
  description: string;
};

export type WizardStep = 1 | 2 | 3;

export type ToastKind = "success" | "error" | "info";

export type ToastState =
  | {
      id: string;
      kind: ToastKind;
      message: string;
    }
  | null;

export type ExistingStepDraft = {
  id: string;
  key: string;
  orderNo: number;
  title: string;
  description: string;
  initial: {
    orderNo: number;
    title: string;
    description: string;
  };
};

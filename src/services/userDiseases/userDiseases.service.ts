import { api } from "@/lib/axios";
import type {
  IListResponse,
  IUserDiseasesResponse,
  IUserDiseaseStepsResponse,
  IUserDiseaseItem,
  IUserDiseaseStepItem,
} from "./userDiseases.types";

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
}

function readString(obj: UnknownRecord, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

function readNumber(obj: UnknownRecord, key: string): number | undefined {
  const v = obj[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function readArray(obj: UnknownRecord, key: string): unknown[] | undefined {
  const v = obj[key];
  return Array.isArray(v) ? v : undefined;
}

function readNullableString(obj: UnknownRecord, key: string): string | null | undefined {
  const v = obj[key];
  if (v === null) return null;
  return typeof v === "string" ? v : undefined;
}

function pick<T>(a: T | undefined, b: T | undefined): T | undefined {
  return a ?? b ?? undefined;
}

function pick3<T>(a: T | undefined, b: T | undefined, c: T | undefined): T | undefined {
  return a ?? b ?? c ?? undefined;
}

function normalizeListResponse<T>(data: unknown, mapItem: (raw: unknown) => T): IListResponse<T> {
  if (!isRecord(data)) return { items: [] };

  const itemsRaw =
    pick(readArray(data, "items"), readArray(data, "Items")) ?? [];

  const items = itemsRaw.map(mapItem);

  const limit = pick(readNumber(data, "limit"), readNumber(data, "Limit"));
  const offset = pick(readNumber(data, "offset"), readNumber(data, "Offset"));
  const total = pick(readNumber(data, "total"), readNumber(data, "Total"));

  return { items, limit, offset, total };
}

function normalizeUserDiseaseItem(raw: unknown): IUserDiseaseItem {
  if (!isRecord(raw)) {
    return {
      categoryName: "",
      completedSteps: 0,
      diseaseId: "",
      diseaseName: "",
      organName: "",
      progressPercent: 0,
      startedAt: "",
      status: "active",
      totalSteps: 0,
      updatedAt: "",
      userDiseaseId: "",
    };
  }

  const categoryName = pick(readString(raw, "categoryName"), readString(raw, "CategoryName")) ?? "";
  const diseaseName = pick(readString(raw, "diseaseName"), readString(raw, "DiseaseName")) ?? "";
  const organName = pick(readString(raw, "organName"), readString(raw, "OrganName")) ?? "";

  const diseaseId =
    pick3(
      readString(raw, "diseaseId"),
      readString(raw, "DiseaseId"),
      readString(raw, "DiseaseID")
    ) ?? "";

  const userDiseaseId =
    pick3(
      readString(raw, "userDiseaseId"),
      readString(raw, "UserDiseaseId"),
      readString(raw, "UserDiseaseID")
    ) ?? "";

  const completedSteps =
    pick(readNumber(raw, "completedSteps"), readNumber(raw, "CompletedSteps")) ?? 0;

  const totalSteps =
    pick(readNumber(raw, "totalSteps"), readNumber(raw, "TotalSteps")) ?? 0;

  const progressPercent =
    pick(readNumber(raw, "progressPercent"), readNumber(raw, "ProgressPercent")) ?? 0;

  const startedAt =
    pick(readString(raw, "startedAt"), readString(raw, "StartedAt")) ?? "";

  const updatedAt =
    pick(readString(raw, "updatedAt"), readString(raw, "UpdatedAt")) ?? "";

  const status =
    pick(readString(raw, "status"), readString(raw, "Status")) ?? "active";

  return {
    categoryName,
    completedSteps,
    diseaseId,
    diseaseName,
    organName,
    progressPercent,
    startedAt,
    status,
    totalSteps,
    updatedAt,
    userDiseaseId,
  };
}

function normalizeUserDiseaseStepItem(raw: unknown): IUserDiseaseStepItem {
  if (!isRecord(raw)) {
    return {
      id: "",
      userDiseaseId: "",
      stepId: "",
      state: "pending",
      completedAt: null,
      createdAt: "",
      updatedAt: "",
    };
  }

  const id = pick(readString(raw, "id"), readString(raw, "ID")) ?? "";

  const userDiseaseId =
    pick3(
      readString(raw, "userDiseaseId"),
      readString(raw, "UserDiseaseId"),
      readString(raw, "UserDiseaseID")
    ) ?? "";

  const stepId =
    pick3(
      readString(raw, "stepId"),
      readString(raw, "StepId"),
      readString(raw, "StepID")
    ) ?? "";

  const state = pick(readString(raw, "state"), readString(raw, "State")) ?? "pending";

  const createdAt = pick(readString(raw, "createdAt"), readString(raw, "CreatedAt")) ?? "";
  const updatedAt = pick(readString(raw, "updatedAt"), readString(raw, "UpdatedAt")) ?? "";

  const completedAt =
    pick(
      readNullableString(raw, "completedAt"),
      readNullableString(raw, "CompletedAt")
    ) ?? null;

  return {
    id,
    userDiseaseId,
    stepId,
    state,
    completedAt,
    createdAt,
    updatedAt,
  };
}

class UserDiseasesService {
  async getMyDiseases(): Promise<IUserDiseasesResponse> {
    const res = await api.get<unknown>("/api/v1/me/diseases");
    return normalizeListResponse(res.data, normalizeUserDiseaseItem);
  }

  async getStepsByUserDiseaseId(userDiseaseId: string): Promise<IUserDiseaseStepsResponse> {
    const res = await api.get<unknown>(`/api/v1/me/diseases/${userDiseaseId}/steps`);
    return normalizeListResponse(res.data, normalizeUserDiseaseStepItem);
  }

  async completeStep(userStepId: string): Promise<void> {
    await api.post(`/api/v1/me/steps/${userStepId}/complete`);
  }

  async resolveDisease(userDiseaseId: string): Promise<void> {
    await api.post(`/api/v1/me/diseases/${userDiseaseId}/resolve`);
  }
}

export const userDiseasesService = new UserDiseasesService();

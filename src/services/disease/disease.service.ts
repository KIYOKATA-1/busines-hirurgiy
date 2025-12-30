import { api } from "@/lib/axios";
import {
  DiseasesFilterParams,
  ICreateDiseaseCategoryRequest,
  ICreateDiseaseRequest,
  ICreatePlanStepRequest,
  IDisease,
  IDiseaseCategoriesResponse,
  IDiseaseCategory,
  IDiseaseDetailsResponse,
  IDiseasePlanApi,
  IDiseasesResponse,
  IUpdateDiseaseRequest,
  IUpsertDiseasePlanRequest,
} from "./disease.types";

class DiseaseService {
  async getCategories(): Promise<IDiseaseCategoriesResponse> {
    const res = await api.get<IDiseaseCategoriesResponse>(
      "/api/v1/diseases/categories"
    );
    return res.data;
  }

  async getAll(params?: DiseasesFilterParams): Promise<IDiseasesResponse> {
    const res = await api.get<IDiseasesResponse>("/api/v1/diseases", {
      params,
    });
    return res.data;
  }

  async create(payload: ICreateDiseaseRequest): Promise<IDisease> {
    const res = await api.post<IDisease>("/api/v1/diseases", payload);
    return res.data;
  }

  async update(id: string, payload: IUpdateDiseaseRequest): Promise<IDisease> {
    const res = await api.put<IDisease>(`/api/v1/diseases/${id}`, payload);
    return res.data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/api/v1/diseases/${id}`);
  }

  async getById(id: string): Promise<IDiseaseDetailsResponse> {
    const res = await api.get<IDiseaseDetailsResponse>(
      `/api/v1/diseases/${id}`
    );
    return res.data;
  }

  async upsertPlan(
    diseaseId: string,
    payload: IUpsertDiseasePlanRequest
  ): Promise<IDiseasePlanApi | null> {
    const res = await api.put<
      IDiseasePlanApi | { plan: IDiseasePlanApi } | null
    >(`/api/v1/diseases/${diseaseId}/plan`, payload);

    const data = res.data;
    if (!data) return null;
    if (typeof data === "object" && "plan" in (data as any))
      return (data as any).plan;
    return data as IDiseasePlanApi;
  }

  async createPlanStep(planId: string, payload: ICreatePlanStepRequest) {
    const res = await api.post(`/api/v1/plans/${planId}/steps`, payload);
    return res.data;
  }

  async createCategoryAdmin(
    payload: ICreateDiseaseCategoryRequest
  ): Promise<IDiseaseCategory> {
    const res = await api.post<IDiseaseCategory>(
      "/api/v1/admin/disease-categories",
      payload
    );
    return res.data;
  }
  
  toSelectOptions(
    categories: IDiseaseCategory[]
  ): Array<{ id: string; label: string }> {
    return categories.map((c) => ({ id: c.id, label: c.title }));
  }
}

export const diseaseService = new DiseaseService();

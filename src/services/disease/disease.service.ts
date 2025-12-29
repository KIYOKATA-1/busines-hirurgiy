import { api } from "@/lib/axios";
import {
  DiseasesFilterParams,
  ICreateDiseaseRequest,
  IDisease,
  IDiseaseCategoriesResponse,
  IDiseaseCategory,
  IDiseaseDetailsResponse,
  IDiseasesResponse,
  IUpdateDiseaseRequest,
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

  async create(
    payload: ICreateDiseaseRequest,
    accessToken: string
  ): Promise<IDisease> {
    const res = await api.post<IDisease>("/api/v1/diseases", payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  }

  async update(
    id: string,
    payload: IUpdateDiseaseRequest,
    accessToken: string
  ): Promise<IDisease> {
    const res = await api.put<IDisease>(`/api/v1/diseases/${id}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return res.data;
  }

  async remove(id: string, accessToken: string): Promise<void> {
    await api.delete(`/api/v1/diseases/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  }

  async getById(id: string): Promise<IDiseaseDetailsResponse> {
    const res = await api.get<IDiseaseDetailsResponse>(
      `/api/v1/diseases/${id}`
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

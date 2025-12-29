import { api } from "@/lib/axios";
import {
  ICreateDiseaseRequest,
  IDisease,
  IDiseaseCategoriesResponse,
  IDiseaseCategory,
  IDiseasesResponse,
} from "./disease.types";

class DiseaseService {
  async getCategories(): Promise<IDiseaseCategoriesResponse> {
    const res = await api.get<IDiseaseCategoriesResponse>(
      "/api/v1/diseases/categories"
    );
    return res.data;
  }

  async getAll(): Promise<IDiseasesResponse> {
    const res = await api.get<IDiseasesResponse>("/api/v1/diseases");
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

  toSelectOptions(
    categories: IDiseaseCategory[]
  ): Array<{ id: string; label: string }> {
    return categories.map((c) => ({ id: c.id, label: c.title }));
  }
}

export const diseaseService = new DiseaseService();

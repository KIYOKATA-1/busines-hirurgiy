import { api } from "@/lib/axios";
import { IDiseaseCategoriesResponse, IDiseaseCategory } from "./disease.types";

class DiseaseService {
  async getCategories(): Promise<IDiseaseCategoriesResponse> {
    const res = await api.get<IDiseaseCategoriesResponse>(
      "/api/v1/diseases/categories"
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

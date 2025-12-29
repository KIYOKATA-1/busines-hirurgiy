export interface IDiseaseCategory {
    code: string;
    id: string;
    title: string;
}

export type IDiseaseCategoriesResponse = IDiseaseCategory[];

export interface ICreateDiseaseRequest {
  categoryId: string;
  description: string;
  organId: string;
  title: string;
}

export interface IDisease {
  id: string;
  categoryId: string;
  description: string;
  organId: string;
  title: string;
  createdAt?: string;
  updatedAt?: string;
}
export interface IDiseaseListCategory {
  id: string;
  code: string;
  title: string;
}

export interface IDiseaseListItem {
  id: string;
  organId: string;
  category: IDiseaseListCategory;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type IDiseasesResponse = IDiseaseListItem[];
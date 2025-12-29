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

export type IUpdateDiseaseRequest = ICreateDiseaseRequest;

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

export interface DiseasesFilterParams {
  organId?: string;
  categoryId?: string;
}

export type IDiseasesResponse = IDiseaseListItem[];

export interface IDiseaseDetailsResponse {
  disease: {
    category: { code: string; id: string; title: string };
    createdAt: string;
    description: string;
    id: string;
    organId: string;
    title: string;
    updatedAt: string;
  };
  plan: {
    createdAt: string;
    description: string;
    diseaseId: string;
    id: string;
    title: string;
    updatedAt: string;
  } | null;
  steps: Array<{
    createdAt: string;
    description: string;
    id: string;
    orderNo: number;
    planId: string;
    title: string;
    updatedAt: string;
  }>;
}

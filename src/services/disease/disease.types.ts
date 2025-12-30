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


export interface IDiseaseApi {
  category: {
    code: string;
    id: string;
    title: string;
  };
  createdAt: string;
  description: string;
  id: string;
  organId: string;
  title: string;
  updatedAt: string;
}

export interface IDiseasePlanApi {
  createdAt: string;
  description: string;
  diseaseId: string;
  id: string;
  title: string;
  updatedAt: string;
}

export interface IDiseaseStepApi {
  createdAt: string;
  description: string;
  id: string;
  orderNo: number;
  planId: string;
  title: string;
  updatedAt: string;
}

export interface IDiseaseListEntry {
  disease: IDiseaseApi;
  plan: IDiseasePlanApi | null;
  steps: IDiseaseStepApi[];
}

export interface DiseasesFilterParams {
  organId?: string;
  categoryId?: string;
}

export type IDiseasesResponse = IDiseaseListEntry[];

export interface IDiseaseDetailsResponse {
  disease: IDiseaseApi;
  plan: IDiseasePlanApi | null;
  steps: IDiseaseStepApi[];
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

export interface IUpsertDiseasePlanRequest {
  title: string;
  description: string;
}

export interface IDiseasePlanApi {
  createdAt: string;
  description: string;
  diseaseId: string;
  id: string;
  title: string;
  updatedAt: string;
}

export interface ICreatePlanStepRequest {
  title: string;
  description: string;
  orderNo: number;
}

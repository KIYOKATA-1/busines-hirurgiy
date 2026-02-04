export type ApiFreeString = string & {};

export type UserDiseaseStatus =
  | "pending"
  | "active"
  | "completed"
  | "resolved"
  | ApiFreeString;
export type UserDiseaseStatusCode = 0 | 1 | 2;
export type UserStepState = "pending" | "active" | "completed" | ApiFreeString;
export type UserStepStateCode = 0 | 1 | 2;

export interface IUserDiseaseItem {
  categoryName: string;
  completedSteps: number;
  diseaseId: string;
  diseaseName: string;
  organName: string;
  progressPercent: number;
  startedAt: string;
  status: UserDiseaseStatus;
  totalSteps: number;
  updatedAt: string;
  userDiseaseId: string;
}

export interface IUserDiseaseStepItem {
  id: string; 
  userDiseaseId: string;
  stepId: string; 
  state: UserStepState;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IListResponse<T> {
  items: T[];
  limit?: number;
  offset?: number;
  total?: number;
}

export type IUserDiseasesResponse = IListResponse<IUserDiseaseItem>;
export type IUserDiseaseStepsResponse = IListResponse<IUserDiseaseStepItem>;

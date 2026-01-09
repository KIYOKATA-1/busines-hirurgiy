export interface IModeratorDashboardUser {
  id: string;

  email: string;
  name: string;
  surname: string;

  lastActivityAt: string;
  activeDiseases: number;

  completedSteps: number;
  totalSteps: number;

  overallProgressPct: number;
}

export interface IModeratorDashboardUsersResponse {
  items: IModeratorDashboardUser[];

  limit: number;
  offset: number;
  total: number;
}

export type ModeratorUsersQuery = {
  limit?: number;
  offset?: number;

  search?: string;
};

export interface IModeratorDashboardStats {
  activeProblems: number;
  avgProgressPercent: number;
  totalParticipants: number;
}

export interface IModeratorDashboardResponse {
  stats: IModeratorDashboardStats;
  users: IModeratorDashboardUsersResponse;
}

export interface IAssignDiseaseRequest {
  diseaseId: string;
  userId: string;
}

export interface IAssignDiseaseResponse {
  totalSteps: number;
  userDiseaseId: string;
}

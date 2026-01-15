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

export interface IUpdateModeratorUserRequest {
  name: string;
  surname: string;
}

export interface IUpdateModeratorUserResponse {
  id: string;
  name: string;
  surname: string;
}

export type ModeratorUserActivityType =
  | "assignment"
  | "step_completed"
  | "status_change";

export type ModeratorActivityAssignmentPayload = {
  diseaseId: string;
  title: string;
  totalSteps: number;
  userDiseaseId: string;
};

export type ModeratorActivityStepCompletedPayload = {
  stepId: string;
  userDiseaseId: string;
  userStepId: string;
};

export type ModeratorActivityStatusChangePayload = {
  reason: string;
  to: string;
  userDiseaseId: string;
};

export type IModeratorUserActivityItem =
  | {
      createdAt: string;
      id: string;
      type: "assignment";
      payload: ModeratorActivityAssignmentPayload;
    }
  | {
      createdAt: string;
      id: string;
      type: "step_completed";
      payload: ModeratorActivityStepCompletedPayload;
    }
  | {
      createdAt: string;
      id: string;
      type: "status_change";
      payload: ModeratorActivityStatusChangePayload;
    };

export interface IModeratorUserActivityResponse {
  items: IModeratorUserActivityItem[];
  limit: number;
  offset: number;
  total: number;
}

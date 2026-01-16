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
  | "status_change"
  | "diary"
  | "feedback";

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

export type ModeratorActivityDiaryPayload = {
  mood: string;
  tags: string[];
  text: string;
};

export type ModeratorActivityFeedbackPayload = {
  targetType: "diary" | "step";
  diaryId?: string;
  userStepId?: string;
  tags: string[];
  text: string;
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
    }
  | {
      createdAt: string;
      id: string;
      type: "diary";
      payload: ModeratorActivityDiaryPayload;
    }
  | {
      createdAt: string;
      id: string;
      type: "feedback";
      payload: ModeratorActivityFeedbackPayload;
    };

export interface IModeratorUserActivityResponse {
  items: IModeratorUserActivityItem[];
  limit: number;
  offset: number;
  total: number;
}

export interface IModeratorUserProgressResponse {
  activeDiseases: number;
  completedSteps: number;
  lastActivityAt: string;
  overallProgressPct: number;
  totalSteps: number;
  userId: string;
}

export type TreatmentDiseaseStatus = "active" | "resolved";
export type TreatmentStepState = "pending" | "completed";
export type TreatmentStepUiStatus = "done" | "not_done" | "in_progress";

export interface ITreatmentStepItem {
  completedAt: string | null;
  createdAt: string;
  description: string;
  id: string;
  isCompleted: boolean;
  isCurrent: boolean;
  state: TreatmentStepState;
  stepId: string;
  stepNumber: number;
  title: string;
  uiStatus: TreatmentStepUiStatus;
  updatedAt: string;
  userDiseaseId: string;
  userStepId?: string;
}

export interface ITreatmentStepsList {
  items: ITreatmentStepItem[];
  total: number;
}

export interface ITreatmentCurrentStep {
  completedAt: string | null;
  createdAt: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  state: TreatmentStepState;
  stepId: string;
  stepNumber: number;
  title: string;
  totalSteps: number;
  uiStatus: TreatmentStepUiStatus;
  updatedAt: string;
  userStepId: string;
}

export interface ITreatmentDiseaseItem {
  categoryName: string;
  completedSteps: number;
  currentStep: ITreatmentCurrentStep | null;
  diseaseId: string;
  diseaseName: string;
  organName: string;
  progressPercent: number;
  startedAt: string;
  status: TreatmentDiseaseStatus;
  steps: ITreatmentStepsList;
  totalSteps: number;
  updatedAt: string;
  userDiseaseId: string;
}

export interface ITreatmentDiseasesResponse {
  items: ITreatmentDiseaseItem[];
  total: number;
}

export interface ITreatmentOverall {
  activeDiseases: number;
  completedSteps: number;
  lastActivityAt: string;
  overallProgressPct: number;
  totalSteps: number;
}

export interface IModeratorUserTreatmentResponse {
  diseases: ITreatmentDiseasesResponse;
  overall: ITreatmentOverall;
  userId: string;
}

export type ModeratorFeedbackTarget =
  | { type: "step"; userStepId: string }
  | { type: "diary"; diaryId: string };

export interface IModeratorCreateFeedbackRequest {
  text: string;
  tags: string[];
  target: ModeratorFeedbackTarget;
}

export interface IModeratorCreateFeedbackResponse {
  createdAt: string;
  id: string;
  payload: {
    diaryId?: string;
    userStepId?: string;
    tags: string[];
    targetType: "diary" | "step";
    text: string;
  };
  type: "feedback";
}

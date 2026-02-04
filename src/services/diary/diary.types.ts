export type CreateDiaryEntryPayload = {
  mood: string;
  tags: string[];
  text: string;
};

export type DiaryActivityType = "diary" | "feedback";

export type DiaryActivityDiaryPayload = {
  mood: string;
  tags: string[];
  text: string;
};

export type DiaryActivityFeedbackPayload = {
  targetType: "diary" | "step";
  diaryId?: string;
  userStepId?: string;
  tags: string[];
  text: string;
};

export type IDiaryActivityItem =
  | {
      createdAt: string;
      id: string;
      type: "diary";
      payload: DiaryActivityDiaryPayload;
    }
  | {
      createdAt: string;
      id: string;
      type: "feedback";
      payload: DiaryActivityFeedbackPayload;
    };

export interface IDiaryActivityResponse {
  items: IDiaryActivityItem[];
  limit?: number;
  offset?: number;
  total?: number;
}

export interface IDiaryEntry {
  id?: string;
  mood: string;
  tags: string[];
  text: string;
  createdAt?: string;
  updatedAt?: string;

  status?: "pending" | "approved" | "rejected";
  moderatorFeedback?: string | null;
}

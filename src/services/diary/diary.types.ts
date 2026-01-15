export type CreateDiaryEntryPayload = {
  mood: string;
  tags: string[];
  text: string;
};

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

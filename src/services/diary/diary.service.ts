import { api } from "@/lib/axios";
import type { CreateDiaryEntryPayload, IDiaryEntry } from "./diary.types";

class DiaryService {
  async createEntry(payload: CreateDiaryEntryPayload): Promise<IDiaryEntry> {
    const res = await api.post<IDiaryEntry>("/api/v1/me/diary", payload);
    return res.data;
  }
}

export const diaryService = new DiaryService();

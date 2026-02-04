import { api } from "@/lib/axios";
import type {
  CreateDiaryEntryPayload,
  IDiaryActivityResponse,
  IDiaryEntry,
} from "./diary.types";

type ListParams = { limit?: number; offset?: number };

class DiaryService {
  async createEntry(payload: CreateDiaryEntryPayload): Promise<IDiaryEntry> {
    const res = await api.post<IDiaryEntry>("/api/v1/me/diary", payload);
    return res.data;
  }

  async getMyDiary(params?: ListParams): Promise<IDiaryActivityResponse> {
    const res = await api.get<IDiaryActivityResponse>("/api/v1/me/diary", {
      params,
    });
    return res.data;
  }
}

export const diaryService = new DiaryService();

import { api } from "@/lib/axios";

import type { CreateLinkRequest, CreateLinkResponse } from "../types";

export async function createLink(boardId: string, payload: CreateLinkRequest) {
  const res = await api.post<CreateLinkResponse>(`/api/v1/boards/${boardId}/links`, payload);
  return res.data;
}

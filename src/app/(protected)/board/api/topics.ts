import { api } from "@/lib/axios";

import type { PatchTopicRequest, PatchTopicResponse } from "../types";

export async function patchTopic(topicId: string, payload: PatchTopicRequest) {
  const res = await api.patch<PatchTopicResponse>(`/api/v1/topics/${topicId}`, payload);
  return res.data;
}


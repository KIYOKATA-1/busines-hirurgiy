import { api } from "@/lib/axios";

import type {
  CreateBoardRequest,
  CreateBoardResponse,
  CreateRootTopicRequest,
  CreateRootTopicResponse,
  CreateTopicRequest,
  CreateTopicResponse,
  GetBoardsResponse,
  GetBoardSnapshotResponse,
} from "../types";

export async function getBoards() {
  const res = await api.get<GetBoardsResponse>("/api/v1/boards");
  return res.data.boards ?? [];
}

export async function createBoard(payload: CreateBoardRequest) {
  const res = await api.post<CreateBoardResponse>("/api/v1/boards", payload);
  return res.data.board;
}

export async function getBoardSnapshot(boardId: string) {
  const res = await api.get<GetBoardSnapshotResponse>(`/api/v1/boards/${boardId}`);
  return res.data;
}

export async function createRootTopic(boardId: string, payload: CreateRootTopicRequest) {
  const res = await api.post<CreateRootTopicResponse>(`/api/v1/boards/${boardId}/root-topic`, payload);
  return res.data;
}

export async function createTopic(boardId: string, payload: CreateTopicRequest) {
  const res = await api.post<CreateTopicResponse>(`/api/v1/boards/${boardId}/topics`, payload);
  return res.data;
}


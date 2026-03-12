import { api } from "@/lib/axios";

import type {
  IBoardByIdResponse,
  IBoardsResponse,
  ICreateBoardRequest,
  ICreateBoardResponse,
  ICreateLinkRequest,
  ICreateLinkResponse,
  ICreateRootTopicRequest,
  ICreateRootTopicResponse,
  ICreateTopicRequest,
  ICreateTopicResponse,
  IMoveTopicsRequest,
  IMoveTopicsResponse,
  IUpdateTopicRequest,
  IUpdateTopicResponse,
} from "./board.types";

class BoardService {
  async getAll(): Promise<IBoardsResponse> {
    const res = await api.get<IBoardsResponse>("/api/v1/boards");
    return res.data;
  }

  async getById(boardId: string): Promise<IBoardByIdResponse> {
    const res = await api.get<IBoardByIdResponse>(`/api/v1/boards/${boardId}`);
    return res.data;
  }

  async createTopic(boardId: string, payload: ICreateTopicRequest): Promise<ICreateTopicResponse> {
    const res = await api.post<ICreateTopicResponse>(`/api/v1/boards/${boardId}/topics`, payload);
    return res.data;
  }

  async createLink(boardId: string, payload: ICreateLinkRequest): Promise<ICreateLinkResponse> {
    const res = await api.post<ICreateLinkResponse>(`/api/v1/boards/${boardId}/links`, payload);
    return res.data;
  }

  async updateTopic(topicId: string, payload: IUpdateTopicRequest): Promise<IUpdateTopicResponse> {
    const res = await api.patch<IUpdateTopicResponse>(`/api/v1/topics/${topicId}`, payload);
    return res.data;
  }

  async moveTopics(boardId: string, payload: IMoveTopicsRequest): Promise<IMoveTopicsResponse> {
    const res = await api.post<IMoveTopicsResponse>(`/api/v1/boards/${boardId}/move-topics`, payload);
    return res.data;
  }

  async create(payload: ICreateBoardRequest): Promise<ICreateBoardResponse> {
    const res = await api.post<ICreateBoardResponse>("/api/v1/boards", payload);
    return res.data;
  }

  async createRootTopic(
    boardId: string,
    payload: ICreateRootTopicRequest
  ): Promise<ICreateRootTopicResponse> {
    const res = await api.post<ICreateRootTopicResponse>(
      `/api/v1/boards/${boardId}/root-topic`,
      payload
    );
    return res.data;
  }
}

export const boardService = new BoardService();

import { api } from "@/lib/axios";

import type {
  IAssignDiseaseRequest,
  IAssignDiseaseResponse,
  IModeratorDashboardResponse,
  ModeratorUsersQuery,
  IUpdateModeratorUserRequest,
  IUpdateModeratorUserResponse,
  IModeratorUserActivityResponse,
  IModeratorUserProgressResponse,
  IModeratorUserTreatmentResponse,
  IModeratorCreateFeedbackRequest,
  IModeratorCreateFeedbackResponse,
} from "./moderatorUsers.types";

class ModeratorUsersService {
  async getDashboard(
    params?: ModeratorUsersQuery
  ): Promise<IModeratorDashboardResponse> {
    const res = await api.get<IModeratorDashboardResponse>(
      "/api/v1/moderator/dashboard",
      { params }
    );
    return res.data;
  }

  async assignDisease(
    payload: IAssignDiseaseRequest
  ): Promise<IAssignDiseaseResponse> {
    const res = await api.post<IAssignDiseaseResponse>(
      "/api/v1/admin/assign-disease",
      payload
    );
    return res.data;
  }

  async updateUser(
    userId: string,
    payload: IUpdateModeratorUserRequest
  ): Promise<IUpdateModeratorUserResponse> {
    const res = await api.put<IUpdateModeratorUserResponse>(
      `/api/v1/moderator/dashboard/users/${userId}`,
      payload
    );
    return res.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/api/v1/moderator/dashboard/users/${userId}`);
  }

  async getUserActivity(
    userId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<IModeratorUserActivityResponse> {
    const res = await api.get<IModeratorUserActivityResponse>(
      `/api/v1/moderator/users/${userId}/activity`,
      { params }
    );
    return res.data;
  }

  async getUserProgress(
    userId: string
  ): Promise<IModeratorUserProgressResponse> {
    const res = await api.get<IModeratorUserProgressResponse>(
      `/api/v1/moderator/users/${userId}/progress`
    );
    return res.data;
  }

  async getUserTreatment(
    userId: string
  ): Promise<IModeratorUserTreatmentResponse> {
    const res = await api.get<IModeratorUserTreatmentResponse>(
      `/api/v1/moderator/users/${userId}/treatment`
    );
    return res.data;
  }

  async createUserFeedback(
    userId: string,
    payload: IModeratorCreateFeedbackRequest
  ): Promise<IModeratorCreateFeedbackResponse> {
    const res = await api.post<IModeratorCreateFeedbackResponse>(
      `/api/v1/moderator/users/${userId}/feedback`,
      payload
    );
    return res.data;
  }
}

export const moderatorUsersService = new ModeratorUsersService();

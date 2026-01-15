import { api } from "@/lib/axios";
import { getCookie } from "@/utils/cookies";

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
} from "./moderatorUsers.types";

const ACCESS_COOKIE = "access_token";

function authHeaders() {
  const token = getCookie(ACCESS_COOKIE);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

class ModeratorUsersService {
  async getDashboard(params?: ModeratorUsersQuery): Promise<IModeratorDashboardResponse> {
    const res = await api.get<IModeratorDashboardResponse>(
      "/api/v1/moderator/dashboard",
      { params, headers: authHeaders() }
    );
    return res.data;
  }

  async assignDisease(payload: IAssignDiseaseRequest): Promise<IAssignDiseaseResponse> {
    const res = await api.post<IAssignDiseaseResponse>(
      "/api/v1/admin/assign-disease",
      payload,
      { headers: authHeaders() }
    );
    return res.data;
  }

  async updateUser(
    userId: string,
    payload: IUpdateModeratorUserRequest
  ): Promise<IUpdateModeratorUserResponse> {
    const res = await api.put<IUpdateModeratorUserResponse>(
      `/api/v1/moderator/dashboard/users/${userId}`,
      payload,
      { headers: authHeaders() }
    );
    return res.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await api.delete(`/api/v1/moderator/dashboard/users/${userId}`, {
      headers: authHeaders(),
    });
  }

  async getUserActivity(
    userId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<IModeratorUserActivityResponse> {
    const res = await api.get<IModeratorUserActivityResponse>(
      `/api/v1/moderator/users/${userId}/activity`,
      { params, headers: authHeaders() }
    );
    return res.data;
  }

  async getUserProgress(userId: string): Promise<IModeratorUserProgressResponse> {
    const res = await api.get<IModeratorUserProgressResponse>(
      `/api/v1/moderator/users/${userId}/progress`,
      { headers: authHeaders() }
    );
    return res.data;
  }

  async getUserTreatment(userId: string): Promise<IModeratorUserTreatmentResponse> {
    const res = await api.get<IModeratorUserTreatmentResponse>(
      `/api/v1/moderator/users/${userId}/treatment`,
      { headers: authHeaders() }
    );
    return res.data;
  }
}

export const moderatorUsersService = new ModeratorUsersService();

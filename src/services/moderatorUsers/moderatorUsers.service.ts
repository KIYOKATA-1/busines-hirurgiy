import { api } from "@/lib/axios";

import type {
  IAssignDiseaseRequest,
  IAssignDiseaseResponse,
  IModeratorDashboardResponse,
  ModeratorUsersQuery,
  IUpdateModeratorUserRequest,
  IUpdateModeratorUserResponse,
  IModeratorUserActivityResponse,
} from "./moderatorUsers.types";
import { getCookie } from "@/utils/cookies";

const ACCESS_COOKIE = "access_token";

function authHeaders() {
  const token = getCookie(ACCESS_COOKIE);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

class ModeratorUsersService {
  async getDashboard(
    params?: ModeratorUsersQuery
  ): Promise<IModeratorDashboardResponse> {
    const res = await api.get<IModeratorDashboardResponse>(
      "/api/v1/moderator/dashboard",
      {
        params,
        headers: authHeaders(),
      }
    );
    return res.data;
  }

  async assignDisease(
    payload: IAssignDiseaseRequest
  ): Promise<IAssignDiseaseResponse> {
    const res = await api.post<IAssignDiseaseResponse>(
      "/api/v1/admin/assign-disease",
      payload,
      {
        headers: authHeaders(),
      }
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
      { params }
    );
    return res.data;
  }
}

export const moderatorUsersService = new ModeratorUsersService();

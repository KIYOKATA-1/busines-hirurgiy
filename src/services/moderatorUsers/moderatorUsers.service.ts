import { api } from "@/lib/axios";
import type {
  IAssignDiseaseRequest,
  IAssignDiseaseResponse,
  IModeratorDashboardResponse,
  ModeratorUsersQuery,
} from "./moderatorUsers.types";

class ModeratorUsersService {
  async getDashboard(params?: ModeratorUsersQuery): Promise<IModeratorDashboardResponse> {
    const res = await api.get<IModeratorDashboardResponse>("/api/v1/moderator/dashboard", {
      params,
    });
    return res.data;
  }

  async assignDisease(payload: IAssignDiseaseRequest): Promise<IAssignDiseaseResponse> {
    const res = await api.post<IAssignDiseaseResponse>(
      "/api/v1/admin/assign-disease",
      payload
    );
    return res.data;
  }
}

export const moderatorUsersService = new ModeratorUsersService();

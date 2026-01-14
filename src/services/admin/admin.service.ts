import { api } from "@/lib/axios";
import type {
  AdminUsersQuery,
  IAdminUsersResponse,
  IAdminUserRolesResponse,
  IAssignUserRoleRequest,
  RoleCode,
} from "./admin.types";

class AdminService {
  async getUsers(params: AdminUsersQuery): Promise<IAdminUsersResponse> {
    const res = await api.get<IAdminUsersResponse>("/api/v1/admin/users", { params });
    return res.data;
  }

  async getUserRoles(userId: string): Promise<IAdminUserRolesResponse> {
    const res = await api.get<IAdminUserRolesResponse>(`/api/v1/admin/users/${userId}/roles`);
    return res.data;
  }

  async addUserRole(userId: string, role: RoleCode): Promise<void> {
    const body: IAssignUserRoleRequest = { role };
    await api.post(`/api/v1/admin/users/${userId}/roles`, body);
  }

  async removeUserRole(userId: string, role: RoleCode): Promise<void> {
    await api.delete(`/api/v1/admin/users/${userId}/roles/${role}`);
  }
}

export const adminService = new AdminService();

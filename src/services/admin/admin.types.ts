export type RoleCode = "participant" | "moderator" | "admin";

export type AdminUsersQuery = {
  q?: string;
  limit?: number;
  offset?: number;
};

export interface IAdminUserListItem {
  id: string;
  email: string;
  name: string;
  surname: string;
  roles: RoleCode[];
}

export interface IAdminUsersResponse {
  items: IAdminUserListItem[];
  limit: number;
  offset: number;
  total: number;
}

export interface IAdminUserRolesResponse {
  roles: RoleCode[];
  userId: string;
}

export interface IAssignUserRoleRequest {
  role: RoleCode;
}

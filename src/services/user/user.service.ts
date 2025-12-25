import { api } from "@/lib/axios";
import { IUserMe } from "./user.types";

class UserService {
  async me(): Promise<IUserMe> {
    const res = await api.get<IUserMe>("/api/v1/me");
    return res.data;
  }
}

export const userService = new UserService();

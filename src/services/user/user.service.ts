import { api } from "@/lib/axios";
import {
  IUserMe,
  UpdateMePayload,
} from "./user.types";

class UserService {
  async me(): Promise<IUserMe> {
    const res = await api.get<IUserMe>("/api/v1/me");
    return res.data;
  }

  async updateMe(payload: UpdateMePayload): Promise<IUserMe> {
    const res = await api.put<IUserMe>("/api/v1/me", payload);
    return res.data;
  }

}

export const userService = new UserService();

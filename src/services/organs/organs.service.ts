import { api } from "@/lib/axios";
import { IOrgansResponse, IOrgan } from "./organ.types";

class OrganService {
  async getAll(): Promise<IOrgansResponse> {
    const res = await api.get<IOrgansResponse>("/api/v1/organs");
    return res.data;
  }

  toSelectOptions(organs: IOrgan[]): Array<{ id: string; label: string }> {
    return organs.map((o) => ({ id: o.id, label: o.title }));
  }
}

export const organService = new OrganService();

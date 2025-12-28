export interface IOrgan {
  id: string;
  slug: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export type IOrgansResponse = IOrgan[];

export interface IUserMe {
  id: string;
  email: string;
  name: string;
  surname: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export type UpdateMePayload = {
  name: string;
  surname: string;
};


export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegistRequest {
  email: string;
  name: string;
  surname: string;
  password: string;
  role: "participant";
}

export interface IRegisterResponse {
  id: string;
  email: string;
  name: string;
  surname: string;
  role: string;
}

export interface IUser {
  id: string;
  email: string;
  name?: string;
  surname?: string;
  role: "admin" | "user" | "participant" | string;
}

export interface ILoginResponse {
  accessToken: string;
  user: IUser;
}

export interface IRefreshResponse {
  accessToken: string;
  user?: IUser;
}

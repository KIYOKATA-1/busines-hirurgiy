export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IUser {
  id: string;
  email: string;
  role: "admin" | "user" | string;
}

export interface ILoginResponse {
  accessToken: string;
  user: IUser;
}

export interface IRefreshRequest {
  refreshToken: string;
}

export interface IRefreshResponse {
  accessToken: string;
  user?: IUser;
}

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
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
}

export interface IApiError {
  status: number;
  message: string;
}

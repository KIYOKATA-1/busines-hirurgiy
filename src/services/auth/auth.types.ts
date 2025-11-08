export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegistRequest{
  email: string;
  name: string;
  password: string;
  role: 'participant';
  surname: string;
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

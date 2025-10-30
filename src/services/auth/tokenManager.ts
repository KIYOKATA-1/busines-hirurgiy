class TokenManager {
  private static instance: TokenManager | null = null;
  private _accessToken: string | null = null;

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  public setAccessToken(token: string): void {
    this._accessToken = token;
  }

  public getAccessToken(): string | null {
    return this._accessToken;
  }

  public clear(): void {
    this._accessToken = null;
  }
}

export const tokenManager = TokenManager.getInstance();
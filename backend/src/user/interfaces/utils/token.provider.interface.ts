export interface TokenProviderInterface {
  sign(payload: any, expiresIn?: string | number): Promise<string>;
  verify(token: string): Promise<any>;
  signAccess(payload: any, expiresIn?: string | number): Promise<string>;
  signRefresh(payload: any, expiresIn?: string | number): Promise<string>;
  verifyAccess(token: string): Promise<any>;
  verifyRefresh(token: string): Promise<any>;
}

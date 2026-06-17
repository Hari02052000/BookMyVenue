export interface PasswordHasherInterface {
  getSalt(): Promise<string>;
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

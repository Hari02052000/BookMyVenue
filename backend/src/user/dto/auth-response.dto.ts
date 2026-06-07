import { UserResponseDto } from "@src/user/dto";

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType?: 'Bearer';
  user?: UserResponseDto;
}

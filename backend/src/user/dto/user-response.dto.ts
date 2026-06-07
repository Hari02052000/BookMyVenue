import { UserRole, UserStatus } from "@src/user/entity/enums";

export interface UserCoordinatesDto {
  longitude: number;
  latitude: number;
}

export interface UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phoneNumber?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  coordinates?: UserCoordinatesDto;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
}

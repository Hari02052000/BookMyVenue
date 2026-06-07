import { UserRole } from "@src/user/entity/enums";

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: UserRole;
  phoneNumber?: string;
  profilePhoto?: string;
}

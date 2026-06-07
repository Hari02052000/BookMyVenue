import { UserRole, UserStatus } from "@src/user/entity/enums";

export type UserSortOrder = "asc" | "desc";
export type UserSortBy =
  | "firstName"
  | "lastName"
  | "email"
  | "role"
  | "status"
  | "createdAt"
  | "updatedAt";

export interface UserQueryDto {
  search?: string;
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdBefore?: string;
  createdAfter?: string;
  sortBy?: UserSortBy;
  sortOrder?: UserSortOrder;
  page?: number;
  limit?: number;
}

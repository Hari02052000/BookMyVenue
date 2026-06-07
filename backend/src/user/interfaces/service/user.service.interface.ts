import {
  ChangeUserEmailDto,
  ChangeUserPhoneDto,
  CreateUserDto,
  LoginUserDto,
  PaginatedResult,
  UpdateUserLocationDto,
  UpdateUserProfileDto,
  UserQueryDto,
  UserResponseDto,
  AuthResponseDto,
} from "@src/user/dto";

export interface UserServiceInterface {
  createUser(input: CreateUserDto): Promise<UserResponseDto>;
  authenticateUser(credentials: LoginUserDto): Promise<AuthResponseDto>;
  refresh(refreshToken: string): Promise<AuthResponseDto>;
  getUserById(id: string): Promise<UserResponseDto | null>;
  getUserByEmail(email: string): Promise<UserResponseDto | null>;
  listUsers(query?: UserQueryDto): Promise<PaginatedResult<UserResponseDto>>;
  updateUserProfile(id: string, input: UpdateUserProfileDto): Promise<UserResponseDto>;
  updateUserLocation(id: string, input: UpdateUserLocationDto): Promise<UserResponseDto>;
  changeUserEmail(id: string, input: ChangeUserEmailDto): Promise<UserResponseDto>;
  changeUserPhone(id: string, input: ChangeUserPhoneDto): Promise<UserResponseDto>;
  verifyUserEmail(id: string): Promise<UserResponseDto>;
  verifyUserPhone(id: string): Promise<UserResponseDto>;
  suspendUser(id: string): Promise<UserResponseDto>;
  reactivateUser(id: string): Promise<UserResponseDto>;
  deleteUser(id: string): Promise<void>;
}

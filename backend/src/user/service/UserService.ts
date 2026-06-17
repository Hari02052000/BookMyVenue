import { User } from "@src/user/entity/User";
import { Email, PhoneNumber, Coordinates } from "@src/user/entity/value-objects";
import { UserRole } from "@src/user/entity/enums";
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
import { UserServiceInterface } from "@src/user/interfaces/service";
import { UserRepositoryInterface } from "@src/user/interfaces/repository";
import {
  PasswordHasherInterface,
  TokenProviderInterface,
  UserMapperInterface,
} from "@src/user/interfaces/utils";
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from "@src/shared/errors";

export class UserService implements UserServiceInterface {
  constructor(
    private readonly repository: UserRepositoryInterface,
    private readonly passwordHasher: PasswordHasherInterface,
    private readonly tokenProvider: TokenProviderInterface,
    private readonly userMapper: UserMapperInterface
  ) {}

  async createUser(input: CreateUserDto): Promise<AuthResponseDto> {
    const email = new Email(input.email);
    const existingUser = await this.repository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("Email already in use");
    }
    let phoneNumber: PhoneNumber | undefined;
    if (input.phoneNumber) {
      phoneNumber = new PhoneNumber(input.phoneNumber);
      const existingByPhone = await this.repository.findByPhoneNumber(
        phoneNumber
      );
      if (existingByPhone) {
        throw new ConflictError("Phone number already in use");
      }
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const salt = await this.passwordHasher.getSalt();
    const user = User.createNew({
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      passwordHash,
      salt,
      role: input.role || UserRole.USER,
      phoneNumber,
    });
    const savedUser = await this.repository.save(user);

    const accessToken = await this.tokenProvider.signAccess(
      { sub: savedUser.id, role: savedUser.role },
      "15m"
    );
    const refreshToken = await this.tokenProvider.signRefresh(
      { sub: savedUser.id },
      "7d"
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      tokenType: "Bearer",
      user: this.userMapper.toResponse(savedUser),
    };
  }

  async authenticateUser(credentials: LoginUserDto): Promise<AuthResponseDto> {
    // Validate input
    if (!credentials.email || credentials.email.trim().length === 0) {
      throw new ValidationError("Email is required");
    }
    if (!credentials.password || credentials.password.length === 0) {
      throw new ValidationError("Password is required");
    }

    // Find user by email
    let email: Email;
    try {
      email = new Email(credentials.email);
    } catch (error) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Verify password
    const passwordMatch = await this.passwordHasher.compare(
      credentials.password,
      user.passwordHash
    );

    if (!passwordMatch) {
      throw new UnauthorizedError("Invalid credentials");
    }

    // Sign tokens
    const accessToken = await this.tokenProvider.signAccess(
      { sub: user.id, role: user.role },
      "15m"
    );
    const refreshToken = await this.tokenProvider.signRefresh(
      { sub: user.id },
      "7d"
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: "Bearer",
      user: this.userMapper.toResponse(user),
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    // Validate input
    if (!refreshToken || refreshToken.trim().length === 0) {
      throw new ValidationError("Refresh token is required");
    }

    // Verify the refresh token
    let payload: any;
    try {
      payload = await this.tokenProvider.verifyRefresh(refreshToken);
    } catch (error) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // Extract user ID from token
    const userId = payload.sub;
    if (!userId) {
      throw new UnauthorizedError("Invalid refresh token payload");
    }

    // Find user by ID
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Check if user is active
    if (!user.isActive()) {
      throw new UnauthorizedError("User account is not active");
    }

    // Sign new tokens
    const newAccessToken = await this.tokenProvider.signAccess(
      { sub: user.id, role: user.role },
      "15m"
    );
    const newRefreshToken = await this.tokenProvider.signRefresh(
      { sub: user.id },
      "7d"
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      tokenType: "Bearer",
      user: this.userMapper.toResponse(user),
    };
  }

  async getUserById(id: string): Promise<UserResponseDto | null> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new ValidationError("User ID is required");
    }

    const user = await this.repository.findById(id);
    if (!user) {
      return null;
    }

    return this.userMapper.toResponse(user);
  }

  async getUserByEmail(email: string): Promise<UserResponseDto | null> {
    // Validate input
    if (!email || email.trim().length === 0) {
      throw new ValidationError("Email is required");
    }

    let emailObj: Email;
    try {
      emailObj = new Email(email);
    } catch (error) {
      throw new ValidationError("Invalid email format");
    }

    const user = await this.repository.findByEmail(emailObj);
    if (!user) {
      return null;
    }

    return this.userMapper.toResponse(user);
  }

  async listUsers(
    query?: UserQueryDto
  ): Promise<PaginatedResult<UserResponseDto>> {
    // Set default pagination if not provided
    const finalQuery: UserQueryDto = {
      page: query?.page || 1,
      limit: query?.limit || 10,
      ...query,
    };

    const result = await this.repository.findUsers(finalQuery);

    return {
      ...result,
      items: result.items.map((user) => this.userMapper.toResponse(user)),
    };
  }

  async updateUserProfile(
    id: string,
    input: UpdateUserProfileDto
  ): Promise<UserResponseDto> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new ValidationError("User ID is required");
    }
    if (!input.firstName || input.firstName.trim().length === 0) {
      throw new ValidationError("First name is required");
    }
    if (!input.lastName || input.lastName.trim().length === 0) {
      throw new ValidationError("Last name is required");
    }

    // Find user
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Update profile
    user.updateProfile(
      input.firstName,
      input.lastName,
      input.profilePhoto
    );

    // Persist
    const updatedUser = await this.repository.save(user);
    return this.userMapper.toResponse(updatedUser);
  }

  async updateUserLocation(
    id: string,
    input: UpdateUserLocationDto
  ): Promise<UserResponseDto> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new ValidationError("User ID is required");
    }

    // Find user
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Create Coordinates value object
    let coordinates: Coordinates;
    try {
      coordinates = new Coordinates(input.longitude, input.latitude);
    } catch (error) {
      throw new ValidationError("Invalid coordinates");
    }

    // Update location
    user.updateLocation(coordinates);

    // Persist
    const updatedUser = await this.repository.save(user);
    return this.userMapper.toResponse(updatedUser);
  }

  async changeUserEmail(
    id: string,
    input: ChangeUserEmailDto
  ): Promise<UserResponseDto> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new ValidationError("User ID is required");
    }
    if (!input.email || input.email.trim().length === 0) {
      throw new ValidationError("Email is required");
    }

    // Find user
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Create Email value object
    let newEmail: Email;
    try {
      newEmail = new Email(input.email);
    } catch (error) {
      throw new ValidationError("Invalid email format");
    }

    // Check if new email already exists
    const existingUser = await this.repository.findByEmail(newEmail);
    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictError("Email already in use");
    }

    // Change email
    user.changeEmail(newEmail);

    // Persist
    const updatedUser = await this.repository.save(user);
    return this.userMapper.toResponse(updatedUser);
  }

  async changeUserPhone(
    id: string,
    input: ChangeUserPhoneDto
  ): Promise<UserResponseDto> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new ValidationError("User ID is required");
    }
    if (!input.phoneNumber || input.phoneNumber.trim().length === 0) {
      throw new ValidationError("Phone number is required");
    }

    // Find user
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Create PhoneNumber value object
    let newPhone: PhoneNumber;
    try {
      newPhone = new PhoneNumber(input.phoneNumber);
    } catch (error) {
      throw new ValidationError("Invalid phone number format");
    }

    // Check if new phone already exists
    const existingUser = await this.repository.findByPhoneNumber(newPhone);
    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictError("Phone number already in use");
    }

    // Change phone
    user.changePhoneNumber(newPhone);

    // Persist
    const updatedUser = await this.repository.save(user);
    return this.userMapper.toResponse(updatedUser);
  }

  async verifyUserEmail(id: string): Promise<UserResponseDto> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new ValidationError("User ID is required");
    }

    // Find user
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify email
    try {
      user.verifyEmail();
    } catch (error: any) {
      throw new UnprocessableEntityError(error.message || "Cannot verify email");
    }

    // Persist
    const updatedUser = await this.repository.save(user);
    return this.userMapper.toResponse(updatedUser);
  }

  async verifyUserPhone(id: string): Promise<UserResponseDto> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new ValidationError("User ID is required");
    }

    // Find user
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify phone
    try {
      user.verifyPhone();
    } catch (error: any) {
      throw new UnprocessableEntityError(error.message || "Cannot verify phone");
    }

    // Persist
    const updatedUser = await this.repository.save(user);
    return this.userMapper.toResponse(updatedUser);
  }

  async suspendUser(id: string): Promise<UserResponseDto> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new ValidationError("User ID is required");
    }

    // Find user
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Suspend
    try {
      user.suspend();
    } catch (error: any) {
      throw new UnprocessableEntityError(error.message || "Cannot suspend user");
    }

    // Persist
    const updatedUser = await this.repository.save(user);
    return this.userMapper.toResponse(updatedUser);
  }

  async reactivateUser(id: string): Promise<UserResponseDto> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new ValidationError("User ID is required");
    }

    // Find user
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Reactivate
    try {
      user.reactivate();
    } catch (error: any) {
      throw new UnprocessableEntityError(
        error.message || "Cannot reactivate user"
      );
    }

    // Persist
    const updatedUser = await this.repository.save(user);
    return this.userMapper.toResponse(updatedUser);
  }

  async deleteUser(id: string): Promise<void> {
    // Validate input
    if (!id || id.trim().length === 0) {
      throw new ValidationError("User ID is required");
    }

    // Find user (ensure exists before deletion)
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Delete
    await this.repository.deleteById(id);
  }
}

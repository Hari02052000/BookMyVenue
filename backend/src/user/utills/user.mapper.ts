import { User } from "@src/user/entity/User";
import { UserMapperInterface } from "@src/user/interfaces/utils";
import { UserResponseDto } from "@src/user/dto";

export class UserMapper implements UserMapperInterface {
  toResponse(user: User): UserResponseDto {
    const userObject = user.getUserObject();

    return {
      id: userObject.id,
      firstName: userObject.firstName,
      lastName: userObject.lastName,
      email: userObject.email,
      role: userObject.role,
      status: userObject.status,
      phoneNumber: userObject.phoneNumber,
      emailVerified: userObject.emailVerified,
      phoneVerified: userObject.phoneVerified,
      coordinates: userObject.coordinates
        ? {
            longitude: userObject.coordinates.coordinates[0],
            latitude: userObject.coordinates.coordinates[1],
          }
        : undefined,
      profilePhoto: userObject.profilePhoto,
      createdAt: userObject.createdAt.toISOString(),
      updatedAt: userObject.updatedAt.toISOString(),
    };
  }
}

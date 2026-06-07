import { User } from "@src/user/entity/User";
import { UserResponseDto } from "@src/user/dto";

export interface UserMapperInterface {
  toResponse(user: User): UserResponseDto;
}

import { User } from "@src/user/entity/User";
import { Email, PhoneNumber } from "@src/user/entity/value-objects";
import { PaginatedResult, UserQueryDto } from "@src/user/dto";

export interface UserRepositoryInterface {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  findByPhoneNumber(phoneNumber: PhoneNumber): Promise<User | null>;
  findUsers(query?: UserQueryDto): Promise<PaginatedResult<User>>;
  deleteById(id: string): Promise<void>;
}

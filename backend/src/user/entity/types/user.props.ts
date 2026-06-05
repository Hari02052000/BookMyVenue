import { Email,Coordinates,PhoneNumber } from '../value-objects';
import { UserRole, UserStatus } from '../enums';

export type UserPropsType = {
  id: string;
  firstName: string;
  lastName: string;
  email: Email;
  passwordHash: string;
  salt: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  phoneNumber?: PhoneNumber;
  coordinates?: Coordinates;
  profilePhoto?: string;
}

import { Email, PhoneNumber, Coordinates } from "./value-objects";
import { UserRole, UserStatus } from "./enums";
import { UserPropsType } from "./types";
import { Base } from "./Base";
import { ValidationError,UnauthorizedError } from "@src/shared/errors";

export class User extends Base {
  private constructor(private props: UserPropsType) {
    super();
  }

  static createNew(params: {
    firstName: string;
    lastName: string;
    email: Email;
    passwordHash: string;
    salt: string;
    role: UserRole;
    phoneNumber?: PhoneNumber;
  }): User {
    this.validate(params.firstName, "First name");
    this.validate(params.lastName, "Last name");
    return new User({
      id: "",
      firstName: params.firstName.trim(),
      lastName: params.lastName.trim(),
      email: params.email,
      passwordHash: params.passwordHash,
      salt: params.salt,
      role: params.role,
      phoneNumber: params.phoneNumber,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      phoneVerified: false,
    });
  }

  static reconstruct(props: UserPropsType): User {
   this.validate(props.id, "ID");
   return new User(props);
  }

  get id(): string {
  if (!this.props.id || this.props.id.trim().length === 0) {
    throw new Error("User has not been persisted");
  }
  return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get salt(): string {
    return this.props.salt;
  }

  verifyEmail(): void {
    if (this.props.emailVerified) {
      throw new ValidationError("Email already verified");
    }

    this.props.emailVerified = true;
    this.touch();
  }

  verifyPhone(): void {
    if (!this.props.phoneNumber) {
      throw new ValidationError("Phone number not found");
    }

    if (this.props.phoneVerified) {
      throw new ValidationError("Phone already verified");
    }

    this.props.phoneVerified = true;
    this.touch();
  }

  changeEmail(email: Email): void {
    if (this.props.email.equals(email)) {
      return;
    }
    this.props.email = email;
    this.props.emailVerified = false;
    this.touch();
  }

  changePhoneNumber(phone: PhoneNumber): void {
    if (
      this.props.phoneNumber &&
      this.props.phoneNumber.equals(phone)
    ) {
      return;
    }

    this.props.phoneNumber = phone;
    this.props.phoneVerified = false;

    this.touch();
  }

  updateProfile(
    firstName: string,
    lastName: string,
    profilePhoto?: string
  ): void {
    User.validate(firstName, "First name");
    User.validate(lastName, "Last name");
    this.props.firstName = firstName.trim();
    this.props.lastName = lastName.trim();

    if (profilePhoto !== undefined) {
      this.props.profilePhoto = profilePhoto;
    }

    this.touch();
  }

  updateLocation(coordinates: Coordinates): void {
    this.props.coordinates = coordinates;
    this.touch();
  }

  suspend(): void {
    if (this.props.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError("Only active users can be suspended");
    }

    this.props.status = UserStatus.SUSPENDED;
    this.touch();
  }

  reactivate(): void {
    if (this.props.status !== UserStatus.SUSPENDED) {
      throw new UnauthorizedError("User is not suspended");
    }

    this.props.status = UserStatus.ACTIVE;
    this.touch();
  }

  isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }
  getUserObject(){
    return {
      id: this.props.id,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
      email: this.props.email.getValue(),
      role: this.props.role,
      status: this.props.status,
      phoneNumber: this.props.phoneNumber ? this.props.phoneNumber.getValue() : undefined,
      emailVerified: this.props.emailVerified,
      phoneVerified: this.props.phoneVerified,
      coordinates: this.props.coordinates ? this.props.coordinates.toGeoJSON() : undefined,
      profilePhoto: this.props.profilePhoto,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
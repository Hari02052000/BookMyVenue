import mongoose, { Document, Model, Schema } from "mongoose";
import { UserRepositoryInterface } from "@src/user/interfaces/repository";
import { User } from "@src/user/entity/User";
import { Email, PhoneNumber, Coordinates } from "@src/user/entity/value-objects";
import { PaginatedResult, UserQueryDto } from "@src/user/dto";
import { UserRole, UserStatus } from "@src/user/entity/enums";

interface UserDocument extends Document {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  phoneNumber?: string;
  coordinates?: {
    type: string;
    coordinates: [number, number];
  };
  profilePhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    salt: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    status: { type: String, enum: Object.values(UserStatus), required: true },
    emailVerified: { type: Boolean, required: true, default: false },
    phoneVerified: { type: Boolean, required: true, default: false },
    phoneNumber: { type: String, unique: true, sparse: true, trim: true },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
    profilePhoto: { type: String, trim: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const UserModel: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);

export class MongooseUserRepository implements UserRepositoryInterface {
  async save(user: User): Promise<User> {
    const userObject = user.getUserObject();
    const payload = {
      firstName: userObject.firstName,
      lastName: userObject.lastName,
      email: userObject.email,
      passwordHash: user.passwordHash,
      salt: user.salt,
      role: userObject.role,
      status: userObject.status,
      emailVerified: userObject.emailVerified,
      phoneVerified: userObject.phoneVerified,
      phoneNumber: userObject.phoneNumber,
      coordinates: userObject.coordinates,
      profilePhoto: userObject.profilePhoto,
    };

    let savedDocument: UserDocument;
    if (userObject.id && userObject.id.trim().length > 0) {
      const updatedDocument = await UserModel.findByIdAndUpdate(userObject.id, payload, {
        new: true,
        runValidators: true,
      }).exec();

      if (!updatedDocument) {
        throw new Error("Unable to update user");
      }

      savedDocument = updatedDocument;
    } else {
      savedDocument = await UserModel.create(payload);
    }

    return this.toEntity(savedDocument);
  }

  async findById(id: string): Promise<User | null> {
    const document = await UserModel.findById(id).exec();
    return document ? this.toEntity(document) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const document = await UserModel.findOne({ email: email.getValue() }).exec();
    return document ? this.toEntity(document) : null;
  }

  async findByPhoneNumber(phoneNumber: PhoneNumber): Promise<User | null> {
    const document = await UserModel.findOne({ phoneNumber: phoneNumber.getValue() }).exec();
    return document ? this.toEntity(document) : null;
  }

  async findUsers(query?: UserQueryDto): Promise<PaginatedResult<User>> {
    const filter: Record<string, any> = {};

    if (query?.search) {
      const searchRegex = new RegExp(query.search, "i");
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
      ];
    }

    if (query?.role) {
      filter.role = query.role;
    }

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.emailVerified !== undefined) {
      filter.emailVerified = query.emailVerified;
    }

    if (query?.phoneVerified !== undefined) {
      filter.phoneVerified = query.phoneVerified;
    }

    if (query?.createdBefore) {
      const beforeDate = new Date(query.createdBefore);
      if (!Number.isNaN(beforeDate.getTime())) {
        filter.createdAt = { ...(filter.createdAt || {}), $lte: beforeDate };
      }
    }

    if (query?.createdAfter) {
      const afterDate = new Date(query.createdAfter);
      if (!Number.isNaN(afterDate.getTime())) {
        filter.createdAt = { ...(filter.createdAt || {}), $gte: afterDate };
      }
    }

    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 10;
    const sortBy = query?.sortBy || "createdAt";
    const sortOrder = query?.sortOrder === "desc" ? -1 : 1;

    const total = await UserModel.countDocuments(filter).exec();
    const documents = await UserModel.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const items = documents.map((document) => this.toEntity(document));

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async deleteById(id: string): Promise<void> {
    await UserModel.findByIdAndDelete(id).exec();
  }

  private toEntity(document: UserDocument): User {
    const email = new Email(document.email);
    const phoneNumber = document.phoneNumber
      ? new PhoneNumber(document.phoneNumber)
      : undefined;
    const coordinates = document.coordinates
      ? new Coordinates(
          document.coordinates.coordinates[0],
          document.coordinates.coordinates[1]
        )
      : undefined;

    const user = User.reconstruct({
      id: document._id.toString(),
      firstName: document.firstName,
      lastName: document.lastName,
      email,
      passwordHash: document.passwordHash,
      salt: document.salt,
      role: document.role,
      status: document.status,
      emailVerified: document.emailVerified,
      phoneVerified: document.phoneVerified,
      phoneNumber,
      coordinates,
      profilePhoto: document.profilePhoto,
    });

    user.createdAt = document.createdAt;
    user.updatedAt = document.updatedAt;

    return user;
  }
}

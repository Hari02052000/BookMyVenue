import mongoose, { Document, Model, Schema } from "mongoose";
import { UserRole, UserStatus } from "@src/user/entity/enums";
import { UserPersistenceProps } from "@src/user/entity/types";

export interface UserDocument extends Document, UserPersistenceProps {
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

export const UserModel: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);

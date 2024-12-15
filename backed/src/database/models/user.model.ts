import mongoose, { Document, Schema } from "mongoose";
import { string } from "zod";

interface UserPreferences {
  enable2FA: boolean;
  emailNotification: boolean;
  twoFectorSecrect?: string;
}

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  createdAT: Date;
  updatedAT: Date;
  userPreference: UserPreferences;
  comparePassword(value: string): Promise<Boolean>;
}

const UserPreferencesSchema = new Schema<UserPreferences>({
  enable2FA: { type: Boolean, default: false },
  emailNotification: { type: Boolean, default: true },
  twoFectorSecrect: { type: Boolean, required: false },
});

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    userPreference: {
      type: UserPreferencesSchema,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: {},
  }
);

UserSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.UserPreferences.twoFectorSecrect,
    return ret;
  },
});


const UserModel = mongoose.model<UserDocument>("User", UserSchema);
export default UserModel;
import mongoose, { Document, Schema } from "mongoose";
import { thirtyDaysFromNow } from "../../common/utils/date-time";

export interface SessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  userAgent: string;
  expiredAt: Date;
  createAt: Date;
}

const sessionSchema = new Schema<SessionDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    index: true,
    required: true,
  },
  userAgent: {
    type: String,
    required: false,
  },
  createAt: {
    type: Date,
    default: Date.now,
  },
  expiredAt: {
    type: Date,
    required: true,
    default: thirtyDaysFromNow,
  },
});

const SessionModel = mongoose.model<SessionDocument>("Session", sessionSchema);

export default SessionModel;

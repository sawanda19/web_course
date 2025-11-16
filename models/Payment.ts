import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IPayment extends Document {
  _id: string;
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: 'created' | 'succeeded' | 'failed' | 'canceled';
  sessionId: string;
  paymentIntentId?: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 50, // minimum 50 cents
    },
    currency: {
      type: String,
      required: true,
      default: 'usd',
      lowercase: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['created', 'succeeded', 'failed', 'canceled'],
      default: 'created',
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    paymentIntentId: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
import mongoose from 'mongoose';

const oid = mongoose.Schema.Types.ObjectId;

const registrationSchema = new mongoose.Schema(
  {
    workshop: { type: oid, ref: 'Workshop', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    status: { type: String, enum: ['active', 'cancelled', 'waitlisted'], default: 'active' },
    registeredBy: { type: oid, ref: 'User', required: true },
    cancelledBy: { type: oid, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

// One ACTIVE/WAITLISTED seat per person per workshop. Cancelled records don't count, so history stays intact.
registrationSchema.index({ workshop: 1, email: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['active', 'waitlisted'] } } });
registrationSchema.index({ workshop: 1, createdAt: -1 });

export default mongoose.model('Registration', registrationSchema);
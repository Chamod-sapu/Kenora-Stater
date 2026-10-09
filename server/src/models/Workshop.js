import mongoose from 'mongoose';
import { WORKSHOP_STATUSES } from '../constants.js';

const workshopSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    instructor: { type: String, required: true, trim: true },
    startsAt: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 15, max: 600 },
    capacity: { type: Number, required: true, min: 1 },
    activeCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: WORKSHOP_STATUSES, default: 'scheduled' },
    location: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true, versionKey: false } }
);

workshopSchema.virtual('seatsAvailable').get(function () {
  return this.capacity - this.activeCount;
});
workshopSchema.index({ startsAt: 1, status: 1 });

export default mongoose.model('Workshop', workshopSchema);
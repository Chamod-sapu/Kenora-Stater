import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: String,
    action: { type: String, required: true },
    entity: String,
    entityId: String,
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: false }, toJSON: { versionKey: false } }
);
auditSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditSchema);
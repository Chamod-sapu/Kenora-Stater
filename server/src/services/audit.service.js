import AuditLog from '../models/AuditLog.js';

export const audit = (user, action, entity, entityId, meta = {}) =>
  AuditLog.create({ actor: user.sub, actorName: user.name, action, entity, entityId: String(entityId), meta });
import { ZodError } from 'zod';

export const notFound = (req, res) =>
  res.status(404).json({ error: { message: 'Not found' } });

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ZodError)
    return res.status(400).json({ error: { message: 'Validation failed', details: err.issues } });
  if (err.code === 11000)
    return res.status(409).json({ error: { message: 'Duplicate value', details: err.keyValue } });
  if (err.name === 'CastError')
    return res.status(400).json({ error: { message: 'Invalid id' } });

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    error: {
      message: status === 500 ? 'Internal server error' : err.message,
      details: err.details,
    },
  });
};
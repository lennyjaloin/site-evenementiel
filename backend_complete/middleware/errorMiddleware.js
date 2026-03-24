// middleware/errorMiddleware.js
export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const isDev = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    message: isDev ? err.message : 'Erreur serveur',
    ...(isDev && { details: err.message, stack: err.stack }),
  });
};

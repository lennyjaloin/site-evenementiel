// middleware/roleMiddleware.js
export const requireRole = (...allowed) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Non authentifié' });
  if (!allowed.includes(req.user.role)) return res.status(403).json({ message: 'Accès refusé' });
  next();
};

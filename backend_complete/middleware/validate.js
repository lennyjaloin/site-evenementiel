/**
 * Middleware de validation avec Zod.
 * Usage :
 *   router.post('/foo', validate(fooSchema), fooController);
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map(issue => ({
      champ: issue.path.join('.'),
      message: issue.message,
    }));

    return res.status(400).json({
      message: 'Donnees invalides',
      errors,
    });
  }

  // remplacer req.body par les données nettoyées
  req.body = result.data;
  next();
};

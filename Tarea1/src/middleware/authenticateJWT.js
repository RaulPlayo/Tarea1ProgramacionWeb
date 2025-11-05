const jwt = require('jsonwebtoken');

// Configuración directa con fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_para_desarrollo_muy_segura_2024';

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Se requiere rol de administrador' });
  }
};

module.exports = {
  authenticateJWT,
  requireAdmin
};
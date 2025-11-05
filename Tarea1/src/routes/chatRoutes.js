const express = require('express');
const { authenticateJWT } = require('../middleware/authenticateJWT');

const router = express.Router();

// Obtener información del chat (protegido)
router.get('/info', authenticateJWT, (req, res) => {
  res.json({
    message: 'Acceso al chat autorizado',
    user: req.user
  });
});

module.exports = router;
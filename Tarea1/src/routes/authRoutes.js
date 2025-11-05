const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Configuración directa con fallback
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_para_desarrollo_muy_segura_2024';

console.log('🔑 JWT Secret en authRoutes:', JWT_SECRET ? '✅ Configurado' : '❌ No configurado');

const router = express.Router();

// Registrar usuario
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('📝 Intentando registrar usuario:', username);

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username y password son requeridos'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        message: 'El usuario debe tener al menos 3 caracteres'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        message: 'El usuario ya existe'
      });
    }

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    const user = new User({
      username,
      password,
      role
    });

    await user.save();
    console.log('✅ Usuario registrado:', username, 'rol:', role);

    // Generar JWT con secret directo
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('💥 Error en registro:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 Intentando login para:', username);

    if (!username || !password) {
      return res.status(400).json({
        message: 'Username y password son requeridos'
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    const isPasswordValid = await user.correctPassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    console.log('✅ Login exitoso para:', username);

    // Generar JWT con secret directo
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });

  } catch (error) {
    console.error('💥 Error en login:', error);
    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
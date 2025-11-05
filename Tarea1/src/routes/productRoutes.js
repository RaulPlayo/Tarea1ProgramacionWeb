const express = require('express');
const Product = require('../models/Product');
const { authenticateJWT, requireAdmin } = require('../middleware/authenticateJWT');

const router = express.Router();

// Obtener todos los productos (público)
router.get('/', async (req, res) => {
  try {
    const { category, platform, search, page = 1, limit = 12 } = req.query;
    
    let filter = {};
    
    if (category && category !== '') filter.category = category;
    if (platform && platform !== '') filter.platform = platform;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({
      message: 'Error al obtener productos',
      error: error.message
    });
  }
});

// Obtener producto por ID (público)
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    res.status(500).json({
      message: 'Error al obtener producto',
      error: error.message
    });
  }
});

// Crear producto (solo admin)
router.post('/', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    console.log('Creando producto:', req.body);
    
    // Validar datos requeridos
    const { name, description, price, imageUrl, category, platform } = req.body;
    if (!name || !description || !price || !imageUrl || !category || !platform) {
      return res.status(400).json({
        message: 'Todos los campos son requeridos: nombre, descripción, precio, imagen, categoría y plataforma'
      });
    }

    const product = new Product(req.body);
    await product.save();
    
    console.log('Producto creado exitosamente:', product._id);
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creando producto:', error);
    res.status(400).json({
      message: 'Error al crear producto',
      error: error.message
    });
  }
});

// Actualizar producto (solo admin)
router.put('/:id', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    console.log('Actualizando producto:', req.params.id, req.body);
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    console.log('Producto actualizado exitosamente');
    res.json(product);
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(400).json({
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
});

// Eliminar producto (solo admin)
// En las rutas DELETE y PUT, añade esto al inicio:
router.delete('/:id', authenticateJWT, requireAdmin, async (req, res) => {
    try {
        console.log('🗑️ Eliminando producto - Usuario:', req.user);
        console.log('🗑️ Product ID:', req.params.id);
        
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        console.log('✅ Producto eliminado exitosamente');
        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        res.status(500).json({
            message: 'Error al eliminar producto',
            error: error.message
        });
    }
});

module.exports = router;
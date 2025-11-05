const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Hash password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Crear usuario admin por defecto si no existe
userSchema.statics.createDefaultAdmin = async function() {
  try {
    const adminExists = await this.findOne({ username: 'admin' });
    if (!adminExists) {
      await this.create({
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      });
      console.log('✅ Usuario admin creado por defecto: admin / admin123');
    } else {
      console.log('✅ Usuario admin ya existe');
    }
  } catch (error) {
    console.error('❌ Error creando admin:', error);
  }
};

module.exports = mongoose.model('User', userSchema);
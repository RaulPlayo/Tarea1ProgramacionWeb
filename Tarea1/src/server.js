const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

// Cargar .env manualmente al inicio
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuración
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/portal_videojuegos';

console.log('🚀 Iniciando servidor...');
console.log('📁 Directorio actual:', __dirname);

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos - rutas absolutas
const publicPath = path.join(process.cwd(), 'public');
console.log('📂 Ruta pública:', publicPath);
app.use(express.static(publicPath));

// Modelos
const User = require('./models/User');
const Product = require('./models/Product');

// Conexión a MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('✅ Conectado a MongoDB');
  // Crear usuario admin por defecto
  await User.createDefaultAdmin();
  
  // Crear algunos productos de ejemplo si no existen
  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.create([
      {
        name: "The Legend of Zelda: Breath of the Wild",
        description: "Una aventura épica en el reino de Hyrule",
        price: 59.99,
        imageUrl: "https://www.nintendo.com/eu/media/images/10_share_images/games_15/wiiu_14/SI_WiiU_TheLegendOfZeldaBreathOfTheWild_image1600w.jpg",
        category: "aventura",
        platform: "Nintendo Switch",
        rating: 4.9,
        featured: true
      },
      {
        name: "Cyberpunk 2077",
        description: "RPG de mundo abierto en Night City",
        price: 49.99,
        imageUrl: "https://www.cyberpunk.net/build/images/pre-order/buy-b/keyart-ue-es@2x-cd66fd0d.jpg",
        category: "rol",
        platform: "PC",
        rating: 4.2,
        featured: false
      }
    ]);
    console.log('✅ Productos de ejemplo creados');
  }
})
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Rutas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/chat', chatRoutes);

// Socket.io para chat en tiempo real
const connectedUsers = new Map();
const typingUsers = new Set();

io.on('connection', (socket) => {
  console.log('💬 Usuario conectado al chat:', socket.id);

  socket.on('user_joined', (userData) => {
    connectedUsers.set(socket.id, userData);
    console.log(`💬 ${userData.username} se unió al chat`);
    
    socket.broadcast.emit('user_joined', {
      username: userData.username,
      message: `${userData.username} se ha unido al chat`,
      timestamp: new Date().toLocaleTimeString()
    });
    
    socket.emit('system_message', {
      message: `Bienvenido al chat, ${userData.username}!`,
      timestamp: new Date().toLocaleTimeString()
    });
  });

  socket.on('chat_message', (data) => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      const messageData = {
        username: user.username,
        message: data.message,
        timestamp: new Date().toLocaleTimeString()
      };
      
      io.emit('chat_message', messageData);
    }
  });

  socket.on('typing_start', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      typingUsers.add(user.username);
      socket.broadcast.emit('user_typing', Array.from(typingUsers));
    }
  });

  socket.on('typing_stop', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      typingUsers.delete(user.username);
      socket.broadcast.emit('user_typing', Array.from(typingUsers));
    }
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`💬 ${user.username} abandonó el chat`);
      socket.broadcast.emit('user_left', {
        username: user.username,
        message: `${user.username} ha abandonado el chat`,
        timestamp: new Date().toLocaleTimeString()
      });
      connectedUsers.delete(socket.id);
      typingUsers.delete(user.username);
    }
  });
});

// Ruta principal - usar ruta absoluta
app.get('/', (req, res) => {
  const indexPath = path.join(process.cwd(), 'public', 'index.html');
  console.log('📄 Sirviendo index.html desde:', indexPath);
  res.sendFile(indexPath);
});

// Ruta de debug
app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    currentDirectory: process.cwd(),
    publicPath: path.join(process.cwd(), 'public')
  });
});

server.listen(PORT, () => {
  console.log(`🎉 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📂 Directorio de trabajo: ${process.cwd()}`);
});

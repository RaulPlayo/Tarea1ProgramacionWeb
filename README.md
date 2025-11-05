# 🎮 Tarea 1 de Programación Web - CentroGame
![Captura de pantalla 1](/docs/Lobby.png)

Bienvenidos a CentroGame, una aplicación web completa de gestión de videojuegos en el que incluimos:

🔐 Sistema de login y registro - Cualquiera puede registrarse.

🛡️ Acceso seguro - Áreas privadas protegidas con tokens JWT.

👥 Dos tipos de usuarios - Usuarios normales y administrador.

📦 Gestión de juegos - El administrador puede agregar, editar y eliminar juegos.

💬 Chat en vivo - Los usuarios registrados pueden chatear entre sí

---

## 🚀 ¿Como lo hemos creado?
- Lo primero que hice fue replicar la estructura que venía en el pdf. Luego lo que hice fue configurar el package.json con las dependencias básicas como express y mongoose para finalmenteluego crear un servidor Express simple en server.js conectado a MongoDB.
- Para la autenticación, comencé por el modelo de Usuario con email, password y luego hice al administrador (que ya viene creado por defecto dentro del código). Desarrollé las rutas de registro y login que generan tokens JWT, y creé el middleware authenticateJWT.js para proteger las rutas privadas verificando los tokens.
-Luego implementé el sistema de juegos con su modelo y las rutas CRUD, diferenciando acceso entre usuarios normales (solo ver) y administradores (crear, editar, eliminar). Para el chat, usé Socket.io creando una interfaz simple en chat.html
- Finalmente en el frontend, desarrollé index.html con login/registro y estilos CSS básicos, mientras client.js manejaba las peticiones a la API.

---

## 🖼️ Capturas de pantalla

### Interfaz principal

### Panel de administración
![Captura de pantalla 2](docs/img/screenshot2.png)

> Guarda tus imágenes en una carpeta `docs/img` dentro del repositorio para mantenerlo ordenado.

---

## 🛠️ Tecnologías utilizadas

| Tipo | Tecnología |
|------|-------------|
| Lenguaje | JavaScript / HTML |
| Base de datos | MongoDB |
| Estilo | CSS |

---

## ⚙️ Instalación y uso

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/usuario/nombre-del-proyecto.git
   cd nombre-del-proyecto

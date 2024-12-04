// Requiere dotenv para cargar las variables de entorno
require('dotenv').config();

const { Client } = require("pg");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// Usa process.env para obtener el puerto y la configuración de la base de datos
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de la base de datos PostgreSQL
const db = new Client({
    host: process.env.DB_HOST,  // Usar la variable de entorno para el host
    port: process.env.DB_PORT,  // Usar la variable de entorno para el puerto
    user: process.env.DB_USER,  // Usar la variable de entorno para el usuario
    password: process.env.DB_PASSWORD,  // Usar la variable de entorno para la contraseña
    database: process.env.DB_NAME,  // Usar la variable de entorno para el nombre de la base de datos
});

// Conexión a la base de datos
db.connect()
    .then(() => console.log("Conectado a la base de datos PostgreSQL"))
    .catch((err) => console.error("Error conectando a PostgreSQL:", err));

// Endpoint para registrar datos de contacto
app.post("/registro", (req, res) => {
    const { nombre, correo, telefono, servicio } = req.body;

    if (!nombre || !correo || !telefono || !servicio) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const query = "INSERT INTO contactos (nombre, correo, telefono, servicio) VALUES ($1, $2, $3, $4)";

    db.query(query, [nombre, correo, telefono, servicio])
        .then(() => {
            res.status(200).json({ message: "Datos registrados correctamente." });
        })
        .catch((err) => {
            console.error("Error al insertar datos:", err);
            res.status(500).json({ error: "Error al registrar los datos." });
        });
});

// Endpoint para registrar usuarios
app.post("/register", (req, res) => {
    const { name, address, password } = req.body;

    if (!name || !address || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const query = "INSERT INTO users (name, address, password) VALUES ($1, $2, $3)"; // Uso de $1, $2, $3

    db.query(query, [name, address, password])
        .then(() => {
            res.status(200).json({ message: "Usuario registrado con éxito" });
        })
        .catch((err) => {
            console.error("Error al insertar datos en la base de datos:", err);
            return res.status(500).json({ error: "Error al registrar usuario" });
        });
});

// Endpoint para buscar un usuario por su ID
app.get("/usuario/:id", (req, res) => {
    const userId = req.params.id;

    const query = "SELECT name, address FROM users WHERE id = $1"; // Uso de $1

    db.query(query, [userId])
        .then((result) => {
            if (result.rows.length === 0) {
                return res.status(404).json({ error: "Usuario no encontrado." });
            }

            const user = result.rows[0];
            res.status(200).json({
                name: user.name,
                address: user.address,
            });
        })
        .catch((err) => {
            console.error("Error al buscar el usuario:", err);
            return res.status(500).json({ error: "Error al obtener los datos del usuario." });
        });
});

// Endpoint para iniciar sesión
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    console.log("Datos recibidos en /login:", req.body); // Verifica qué llega realmente

    if (!email || !password) {
        return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
    }

    const query = "SELECT id FROM users WHERE address = $1 AND password = $2"; // Uso de $1, $2

    db.query(query, [email, password])
        .then((results) => {
            if (results.rows.length === 0) {
                return res.status(401).json({ error: "Correo o contraseña incorrectos." });
            }

            res.status(200).json({ userId: results.rows[0].id });
        })
        .catch((err) => {
            console.error("Error al validar las credenciales:", err);
            return res.status(500).json({ error: "Error al iniciar sesión." });
        });
});

// Endpoint para autenticar y registrar el pedido
app.post("/authenticate", (req, res) => {
    const { email, password, serviceName } = req.body;

    if (!email || !password || !serviceName) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    // Verificar si el usuario existe
    const queryUser = "SELECT id FROM users WHERE address = $1 AND password = $2"; // Uso de $1, $2
    db.query(queryUser, [email, password])
        .then((results) => {
            if (results.rows.length === 0) {
                return res.status(401).json({ error: "Credenciales incorrectas." });
            }

            const userId = results.rows[0].id;

            // Registrar el pedido
            const queryPedido = "INSERT INTO pedidos (user_id, service_name) VALUES ($1, $2)"; // Uso de $1, $2
            db.query(queryPedido, [userId, serviceName])
                .then(() => {
                    res.status(200).json({ message: "Pedido registrado con éxito." });
                })
                .catch((err) => {
                    console.error("Error al registrar el pedido:", err);
                    return res.status(500).json({ error: "Error al registrar el pedido." });
                });
        })
        .catch((err) => {
            console.error("Error en la autenticación:", err);
            return res.status(500).json({ error: "Error del servidor." });
        });
});

// Endpoint para obtener los pedidos de un usuario
app.post("/pedidos", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
    }

    // Verificar si el usuario existe
    const queryUser = "SELECT id FROM users WHERE address = $1 AND password = $2"; // Uso de $1, $2
    db.query(queryUser, [email, password])
        .then((results) => {
            if (results.rows.length === 0) {
                return res.status(401).json({ error: "Credenciales incorrectas." });
            }

            const userId = results.rows[0].id;

            // Obtener los pedidos del usuario
            const queryPedidos = "SELECT * FROM pedidos WHERE user_id = $1"; // Uso de $1
            db.query(queryPedidos, [userId])
                .then((pedidos) => {
                    res.status(200).json({ pedidos: pedidos.rows });
                })
                .catch((err) => {
                    console.error("Error al obtener pedidos:", err);
                    return res.status(500).json({ error: "Error al obtener pedidos." });
                });
        })
        .catch((err) => {
            console.error("Error en la autenticación:", err);
            return res.status(500).json({ error: "Error del servidor." });
        });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

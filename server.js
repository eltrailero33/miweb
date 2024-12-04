const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5432;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuración de la base de datos MySQL
const db = mysql.createConnection({
    host: "dpg-ct7vs2i3esus73a302ig-a",
    user: "logistica_2kwh_user", // Cambia este valor si tu usuario es diferente
    password: "KuXI7DdgCqEHvyp7Y7pglRGFYo0osAKz", // Cambia por tu contraseña de MySQL
    database: "logistica_2kwh", // Cambia por el nombre de tu base de datos
});

// Conexión a la base de datos
db.connect((err) => {
    if (err) {
        console.error("Error conectando a MySQL:", err);
    } else {
        console.log("Conectado a la base de datos MySQL");
    }
});

// Endpoint para registrar datos de contacto
app.post("/registro", (req, res) => {
    const { nombre, correo, telefono, servicio } = req.body;

    if (!nombre || !correo || !telefono || !servicio) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const query = "INSERT INTO contactos (nombre, correo, telefono, servicio) VALUES (?, ?, ?, ?)";

    db.query(query, [nombre, correo, telefono, servicio], (err, result) => {
        if (err) {
            console.error("Error al insertar datos:", err);
            return res.status(500).json({ error: "Error al registrar los datos." });
        }
        res.status(200).json({ message: "Datos registrados correctamente." });
    });
});

// Endpoint para registrar usuarios
app.post("/register", (req, res) => {
    const { name, address, password } = req.body;

    if (!name || !address || !password) {
        return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const query = "INSERT INTO users (name, address, password) VALUES (?, ?, ?)";

    db.query(query, [name, address, password], (err, results) => {
        if (err) {
            console.error("Error al insertar datos en la base de datos:", err);
            return res.status(500).json({ error: "Error al registrar usuario" });
        }

        res.status(200).json({ message: "Usuario registrado con éxito" });
    });
});

// Endpoint para buscar un usuario por su ID
app.get("/usuario/:id", (req, res) => {
    const userId = req.params.id;

    const query = "SELECT name, address FROM users WHERE id = ?";

    db.query(query, [userId], (err, result) => {
        if (err) {
            console.error("Error al buscar el usuario:", err);
            return res.status(500).json({ error: "Error al obtener los datos del usuario." });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: "Usuario no encontrado." });
        }

        const user = result[0];
        res.status(200).json({
            name: user.name,
            address: user.address,
        });
    });
});

// Endpoint para iniciar sesión
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    console.log("Datos recibidos en /login:", req.body); // Verifica qué llega realmente

    if (!email || !password) {
        return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
    }

    const query = "SELECT id FROM users WHERE address = ? AND password = ?";
    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error("Error al validar las credenciales:", err);
            return res.status(500).json({ error: "Error al iniciar sesión." });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Correo o contraseña incorrectos." });
        }

        res.status(200).json({ userId: results[0].id });
    });
});

// Endpoint para autenticar y registrar el pedido
app.post("/authenticate", (req, res) => {
    const { email, password, serviceName } = req.body;

    if (!email || !password || !serviceName) {
        return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    // Verificar si el usuario existe
    const queryUser = "SELECT id FROM users WHERE address = ? AND password = ?";
    db.query(queryUser, [email, password], (err, results) => {
        if (err) {
            console.error("Error en la autenticación:", err);
            return res.status(500).json({ error: "Error del servidor." });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Credenciales incorrectas." });
        }

        const userId = results[0].id;

        // Registrar el pedido
        const queryPedido = "INSERT INTO pedidos (user_id, service_name) VALUES (?, ?)";
        db.query(queryPedido, [userId, serviceName], (err) => {
            if (err) {
                console.error("Error al registrar el pedido:", err);
                return res.status(500).json({ error: "Error al registrar el pedido." });
            }

            res.status(200).json({ message: "Pedido registrado con éxito." });
        });
    });
});

// Endpoint para obtener los pedidos de un usuario
app.post("/pedidos", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Correo y contraseña son obligatorios." });
    }

    // Verificar si el usuario existe
    const queryUser = "SELECT id FROM users WHERE address = ? AND password = ?";
    db.query(queryUser, [email, password], (err, results) => {
        if (err) {
            console.error("Error en la autenticación:", err);
            return res.status(500).json({ error: "Error del servidor." });
        }

        if (results.length === 0) {
            return res.status(401).json({ error: "Credenciales incorrectas." });
        }

        const userId = results[0].id;

        // Obtener los pedidos del usuario
        const queryPedidos = "SELECT * FROM pedidos WHERE user_id = ?";
        db.query(queryPedidos, [userId], (err, pedidos) => {
            if (err) {
                console.error("Error al obtener pedidos:", err);
                return res.status(500).json({ error: "Error al obtener pedidos." });
            }

            res.status(200).json({ pedidos });
        });
    });
});
// Endpoint para cancelar un pedido
app.post("/cancelarPedido", (req, res) => {
    const { pedidoId } = req.body;

    if (!pedidoId) {
        return res.status(400).json({ error: "El ID del pedido es obligatorio." });
    }

    // Actualizar el estado del pedido
    const query = "UPDATE pedidos SET estado = 'Cancelado' WHERE id = ?";
    db.query(query, [pedidoId], (err, result) => {
        if (err) {
            console.error("Error al cancelar el pedido:", err);
            return res.status(500).json({ error: "Error al cancelar el pedido." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Pedido no encontrado." });
        }

        res.status(200).json({ message: "Pedido cancelado exitosamente." });
    });
});


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

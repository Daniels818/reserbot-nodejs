// server.js - Servidor principal de ReserBot
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuración de Supabase
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Ruta principal - servir index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes

// GET - Obtener todas las reservas
app.get('/api/reservas', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select('*')
            .order('fecha', { ascending: true });

        if (error) {
            console.error('Error al obtener reservas:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST - Crear nueva reserva
app.post('/api/reservas', async (req, res) => {
    try {
        const { nombre, fecha, hora, servicio } = req.body;

        // Validaciones básicas
        if (!nombre || !fecha || !hora || !servicio) {
            return res.status(400).json({ 
                error: 'Todos los campos son obligatorios' 
            });
        }

        if (nombre.length < 3) {
            return res.status(400).json({ 
                error: 'El nombre debe tener al menos 3 caracteres' 
            });
        }

        // Validar fecha no sea en el pasado
        const fechaReserva = new Date(fecha);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (fechaReserva < hoy) {
            return res.status(400).json({ 
                error: 'No puedes hacer reservas en fechas pasadas' 
            });
        }

        // Insertar en Supabase
        const { data, error } = await supabase
            .from('reservas')
            .insert([{ nombre, fecha, hora, servicio }])
            .select();

        if (error) {
            console.error('Error al crear reserva:', error);
            return res.status(400).json({ error: error.message });
        }

        res.status(201).json({ 
            success: true, 
            message: 'Reserva creada exitosamente',
            data: data[0] 
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE - Eliminar reserva
app.delete('/api/reservas/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('reservas')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error al eliminar reserva:', error);
            return res.status(400).json({ error: error.message });
        }

        res.json({ 
            success: true, 
            message: 'Reserva eliminada exitosamente' 
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta de prueba para verificar conexión con Supabase
app.get('/api/test', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reservas')
            .select('count', { count: 'exact' });

        if (error) {
            return res.status(400).json({ 
                error: 'Error de conexión con Supabase',
                details: error.message 
            });
        }

        res.json({ 
            success: true, 
            message: 'Conexión con Supabase exitosa',
            totalReservas: data.length 
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📱 Aplicación disponible en: http://localhost:${PORT}`);
});
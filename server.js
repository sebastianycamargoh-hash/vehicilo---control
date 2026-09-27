const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de Supabase (Asegúrate de usar tus credenciales reales si las manejas por variables de entorno o déjalas aquí si ya las tenías configuradas)
const SUPABASE_URL = process.env.SUPABASE_URL || 'TU_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'TU_SUPABASE_ANON_KEY';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para la página principal (Registro)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para el historial público
app.get('/records', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'records.html'));
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API: Obtener todos los registros
app.get('/api/vehiculos', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('vehiculos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Error al obtener registros:', error.message);
        res.status(500).json({ error: 'Error al obtener los registros' });
    }
});

// API: Crear un nuevo registro (CON VALIDACIÓN DE 6 CARACTERES)
app.post('/api/vehiculos', async (req, res) => {
    try {
        let { placa, farm_name, cantidad, hora_salida, posible_llegada } = req.body;

        if (!placa) {
            return res.status(400).json({ error: 'La placa es obligatoria.' });
        }

        // Limpiar espacios y convertir a mayúsculas
        placa = placa.trim().toUpperCase();

        // VALIDACIÓN ESTRICTA: Exactamente 6 caracteres
        if (placa.length !== 6) {
            return res.status(400).json({ error: 'La placa debe tener exactamente 6 caracteres.' });
        }

        const { data, error } = await supabase
            .from('vehiculos')
            .insert([{ placa, farm_name, cantidad, hora_salida, posible_llegada, status: 'Pending' }]);

        if (error) throw error;
        res.status(201).json({ message: 'Registro guardado exitosamente', data });
    } catch (error) {
        console.error('Error al guardar:', error.message);
        res.status(500).json({ error: 'Error al guardar el registro' });
    }
});

// API: Actualizar estado (Pending / Downloaded)
app.patch('/api/vehiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from('vehiculos')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Estado actualizado correctamente', data });
    } catch (error) {
        console.error('Error al actualizar estado:', error.message);
        res.status(500).json({ error: 'Error al actualizar el estado' });
    }
});

// API: Eliminar un registro
app.delete('/api/vehiculos/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('vehiculos')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ message: 'Registro eliminado correctamente', data });
    } catch (error) {
        console.error('Error al eliminar:', error.message);
        res.status(500).json({ error: 'Error al eliminar el registro' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

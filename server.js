const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const supabaseUrl = 'https://hfkniskjpxcyndqorkte.supabase.co';
const supabaseKey = 'sb_publishable__YttPx0O1PRPURpNHzQSbA_aZhhVIgT'; 
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/records', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'records.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/save-record', async (req, res) => {
    let { placa, farm_name, cantidad, hora_salida, posible_llegada } = req.body;

    if (!placa) {
        return res.status(400).send('La placa es obligatoria.');
    }

    placa = placa.trim().toUpperCase();
    farm_name = farm_name ? farm_name.trim().toUpperCase() : '';

    if (placa.length !== 6) {
        return res.status(400).send('Error: La placa debe tener exactamente 6 caracteres.');
    }

    const { error } = await supabase
        .from('vehiculos')
        .insert([{ 
            placa, 
            farm_name, 
            cantidad, 
            hora_salida, 
            posible_llegada, 
            estado: 'En Tránsito a Planta' 
        }]);

    if (error) {
        console.error('Error al guardar en Supabase:', error);
        return res.status(500).send('Error al guardar el registro');
    }

    res.redirect('/records');
});

app.get('/api/records', async (req, res) => {
    const { data, error } = await supabase
        .from('vehiculos')
        .select('*')
        .order('hora_salida', { ascending: false });

    if (error) {
        return res.status(500).json({ error: error.message });
    }

    res.json(data);
});

app.get('/toggle-status/:placa', async (req, res) => {
    const { placa } = req.params;

    const { data, error: fetchError } = await supabase
        .from('vehiculos')
        .select('estado')
        .eq('placa', placa)
        .single();

    if (fetchError) {
        console.error('Error al obtener estado:', fetchError);
        return res.redirect('/admin');
    }

    const nuevoEstado = data.estado === 'En Planta' ? 'En Tránsito a Planta' : 'En Planta';

    const { error: updateError } = await supabase
        .from('vehiculos')
        .update({ estado: nuevoEstado })
        .eq('placa', placa);

    if (updateError) {
        console.error('Error al actualizar estado:', updateError);
    }

    res.redirect('/admin');
});

app.get('/delete-record/:placa', async (req, res) => {
    const { placa } = req.params;

    const { error } = await supabase
        .from('vehiculos')
        .delete()
        .eq('placa', placa);

    if (error) {
        console.error('Error al borrar:', error);
    }

    res.redirect('/admin');
});

app.listen(port, () => {
    console.log(`Servidor de vehículos corriendo en puerto ${port}`);
});

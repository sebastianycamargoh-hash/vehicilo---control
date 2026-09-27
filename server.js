// Guardar registro (con mayúsculas, validación de 6 caracteres y estado inicial "En Tránsito a Planta")
app.post('/save-record', async (req, res) => {
    let { placa, farm_name, cantidad, hora_salida, posible_llegada } = req.body;

    if (!placa) {
        return res.status(400).send('La placa es obligatoria.');
    }

    // Convertir todo a MAYÚSCULAS y limpiar espacios
    placa = placa.trim().toUpperCase();
    farm_name = farm_name ? farm_name.trim().toUpperCase() : '';

    // Validación estricta de 6 caracteres
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

// Cambiar estado (En Tránsito a Planta <-> En Planta) desde el panel de admin
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

    // Alternar entre los nuevos estados
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

require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// Anti spam simple
const cooldowns = new Map();

app.post('/api/coaching', async (req, res) => {

    const ip = req.ip;

    // Cooldown de 24 horas
    const lastRequest = cooldowns.get(ip);

    if (lastRequest && Date.now() - lastRequest < 24 * 60 * 60 * 1000) {

        return res.status(429).json({
            success: false,
            error: 'Ya enviaste una solicitud. Espera 24 horas.'
        });
    }

    const {
        name,
        discord,
        coach,
        pkg,
        character,
        elo,
        message
    } = req.body;

    // Validación básica
    if (!name || !discord || !coach || !pkg || !character || !elo || !message) {

        return res.status(400).json({
            success: false,
            error: 'Faltan campos.'
        });
    }

    try {

        const discordResponse = await fetch(process.env.DISCORD_WEBHOOK, {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({

                embeds: [{
                    title: '🔥 Nueva Solicitud de Coaching',
                    color: 16711680,

                    fields: [
                        {
                            name: '👤 Nombre',
                            value: name
                        },
                        {
                            name: '💬 Discord',
                            value: discord
                        },
                        {
                            name: '🎮 Coach',
                            value: coach
                        },
                        {
                            name: '📦 Paquete',
                            value: pkg
                        },
                        {
                            name: '⚔️ Character',
                            value: character
                        },
                        {
                            name: '🏆 Elo',
                            value: elo
                        },
                        {
                            name: '📝 Mensaje',
                            value: message
                        }
                    ],

                    footer: {
                        text: `IP: ${ip}`
                    }
                }]
            })
        });

        if (!discordResponse.ok) {

            throw new Error('Error enviando a Discord');
        }

        // Guardar cooldown
        cooldowns.set(ip, Date.now());

        res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});

app.listen(process.env.PORT || 3000, () => {

    console.log(`Servidor activo en http://localhost:${process.env.PORT || 3000}`);
});
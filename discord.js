<<<<<<< HEAD
=======
//You can install directly discord.js file with npm install. For installing latest version command npm install discord.js@latest


>>>>>>> 1c2727e502f35674d99e1d622791299d332e0a34
const { Client, GatewayIntentBits } = require('discord.js');

// Création du client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Quand le bot est prêt
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});

// Quand un message est envoyé
client.on('messageCreate', message => {
    if (message.author.bot) return;

    if (message.content === '!ping') {
        message.reply('Pong 🏓');
    }
});

// Connexion avec le token
client.login('TON_TOKEN_ICI');
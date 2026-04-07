

<<<<<<< HEAD

=======
>>>>>>> catan
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
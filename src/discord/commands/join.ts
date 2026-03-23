import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';


export const joinCommand = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Rejoindre le lobby de la partie en cours'),
  
  async execute(interaction: CommandInteraction, currentGame: any, lobbyPlayers: any[]) {
    const user = interaction.user;

    if (currentGame) {
        return interaction.reply({ 
            content: "Une partie est déjà en cours. Attendez la fin pour en lancer une nouvelle.", 
            ephemeral: true 
        });
    }

    if (lobbyPlayers.find(p => p.id === user.id)) {
        return interaction.reply({ 
            content: "Vous avez déjà rejoint le lobby !", 
            ephemeral: true 
        });
    }

    if (lobbyPlayers.length >= 4) {
        return interaction.reply({ 
            content: "Le lobby est complet (4 joueurs max).", 
            ephemeral: true 
        });
    }

    const colors = ["#FF0000", "#0000FF", "#00FF00", "#FFA500"]; 
    const playerColor = colors[lobbyPlayers.length];

    // Ajouter le joueur au lobby
    lobbyPlayers.push({
        id: user.id,
        username: user.username,
        color: playerColor
    });

    const playerList = lobbyPlayers.map(p => p.username).join(', ');

    const embed = new EmbedBuilder()
        .setTitle("🏰 Les Colons de Catane - Lobby")
        .setDescription(`**${user.username}** a rejoint l'aventure !
        
**Joueurs (${lobbyPlayers.length}/4) :**
${playerList}`)
        .setColor(playerColor as any)
        .setThumbnail(user.displayAvatarURL())
        .setFooter({ text: "Utilisez /begin pour lancer la partie quand tout le monde est prêt !" });

    await interaction.reply({ embeds: [embed] });
  }
};
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';

export const joinCommand = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Rejoindre le lobby de la partie'),

  async execute(interaction: CommandInteraction, lobbyPlayers: any[], currentGame: any) {
    const user = interaction.user;

    if (currentGame) {
      return interaction.reply({ content: "Une partie est déjà en cours !", ephemeral: true });
    }

    if (lobbyPlayers.find(p => p.id === user.id)) {
      return interaction.reply({ content: "Tu es déjà dans le lobby.", ephemeral: true });
    }

    if (lobbyPlayers.length >= 4) {
      return interaction.reply({ content: "Le lobby est plein (4 joueurs max).", ephemeral: true });
    }

    const colors = ["#FF0000", "#0000FF", "#00FF00", "#FFA500"];
    const playerColor = colors[lobbyPlayers.length];

    lobbyPlayers.push({
      id: user.id,
      username: user.username,
      color: playerColor
    });

    const embed = new EmbedBuilder()
      .setTitle("🏰 Nouveau Colon !")
      .setDescription(`**${user.username}** a rejoint l'île de Catane.\n\n**Joueurs :** ${lobbyPlayers.length}/4\nListe : ${lobbyPlayers.map(p => p.username).join(', ')}`)
      .setColor(playerColor as any)
      .setThumbnail(user.displayAvatarURL());

    await interaction.reply({ embeds: [embed] });
  }
};

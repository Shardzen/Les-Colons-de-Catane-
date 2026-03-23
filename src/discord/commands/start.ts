import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';

export const startCommand = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Ouvrir un lobby pour une nouvelle partie de Catane'),

  async execute(interaction: CommandInteraction, currentGame: any, lobbyPlayers: any[]) {
    if (currentGame) {
      return interaction.reply({ 
        content: "Une partie est déjà en cours dans ce salon !", 
        ephemeral: true 
      });
    }

    // Réinitialiser le lobby avec le créateur
    lobbyPlayers.length = 0;
    lobbyPlayers.push({
      id: interaction.user.id,
      username: interaction.user.username,
      color: "#FF0000" // Rouge pour le créateur
    });

    const embed = new EmbedBuilder()
      .setTitle("🎲 Nouveau Lobby : Les Colons de Catane")
      .setDescription(`Le lobby est ouvert ! **${interaction.user.username}** attend des colons.\n\nUtilisez **/join** pour rejoindre (2-4 joueurs).`)
      .setColor(0x00AE86)
      .setFooter({ text: "Catan Bot - Système de Lobby" });

    await interaction.reply({ embeds: [embed] });
  }
};

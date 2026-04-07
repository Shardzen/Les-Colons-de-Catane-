import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from "discord.js";
import { GameManager } from "../../core/gameManager.js";

export const startCommand = {
  data: new SlashCommandBuilder()
    .setName("start")
    .setDescription("Ouvrir un lobby"),
  async execute(interaction: CommandInteraction, gameManager: GameManager) {
    const user = interaction.user;
    const lobby = gameManager.getLobby(interaction.channelId);
    if (lobby.find(p => p.id === user.id)) return interaction.reply({ content: "Déjà dans le lobby !", ephemeral: true });

    gameManager.joinGame(interaction.channelId, { id: user.id, username: user.username });
    const embed = new EmbedBuilder()
      .setTitle("?? Nouveau Lobby")
      .setDescription(`${user.username} a ouvert le lobby. /join pour rejoindre.`)
      .setColor(0x0099FF);
    await interaction.reply({ embeds: [embed] });
  }
};


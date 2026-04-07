import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { GameManager } from "../../core/gameManager.js";
import { renderBoardEmoji } from "../../core/boardRenderer.js";

export const beginCommand = {
  data: new SlashCommandBuilder()
    .setName("begin")
    .setDescription("Lancer la partie"),
  async execute(interaction: CommandInteraction, gameManager: GameManager) {
    const success = gameManager.startGame(interaction.channelId);
    if (!success) return interaction.reply({ content: "Min 2 joueurs !", ephemeral: true });

    const game = gameManager.getGame(interaction.channelId)!;
    const boardRender = renderBoardEmoji(game.board.hexes);
    const rollButton = new ButtonBuilder().setCustomId("roll_dice").setLabel("Lancer les Dés").setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(rollButton);

    const embed = new EmbedBuilder()
      .setTitle("?? Catane - Début !")
      .setDescription(`${boardRender}\n\nTour de **${game.players[game.currentPlayerIndex]?.username}** !`)
      .setColor(0xFFA500);

    await interaction.reply({ embeds: [embed], components: [row] });
  }
};


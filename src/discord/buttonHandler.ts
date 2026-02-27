import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageComponentInteraction } from 'discord.js';
import { GameManager } from '../core/gameManager.js';

export class ButtonHandler {
  constructor(private gameManager: GameManager) {}

  async handleInteraction(interaction: MessageComponentInteraction) {
    const customId = interaction.customId;
    if (customId === 'roll_dice') {
        const roll = this.gameManager.rollDice(interaction.channelId);
        await interaction.reply({ content: `🎲 ${interaction.user.username} a lancé les dés et a obtenu **${roll}** !` });
    }
  }
}

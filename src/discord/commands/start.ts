import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player } from '../../core/types.js';

export const startCommand = {
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Starts a new game lobby for Les Colons de Catane'),
  
  async execute(interaction: CommandInteraction, gameManager: GameManager) {
    const user = interaction.user;
    const player: Player = {
        id: user.id,
        username: user.username,
        resources: {
            'WOOD': 0, 'BRICK': 0, 'SHEEP': 0, 'WHEAT': 0, 'ORE': 0, 'DESERT': 0
        },
        devCards: {},
        victoryPoints: 0
    };

    gameManager.createGame(interaction.channelId, player);
    
    const embed = new EmbedBuilder()
        .setTitle("Les Colons de Catane - Nouveau Lobby")
        .setDescription(`${user.username} a ouvert un lobby ! Utilisez \`/join\` pour le rejoindre.`)
        .setColor(0x0099FF);

    await interaction.reply({ embeds: [embed] });
  }
};

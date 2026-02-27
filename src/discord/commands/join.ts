import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player } from '../../core/types.js';

export const joinCommand = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins an existing game lobby'),
  
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

    const success = gameManager.joinGame(interaction.channelId, player);
    
    if (success) {
        const game = gameManager.getGame(interaction.channelId);
        const playerList = game?.players.map(p => p.username).join(', ');
        const embed = new EmbedBuilder()
            .setTitle("Les Colons de Catane - Lobby")
            .setDescription(`${user.username} a rejoint la partie !
Joueurs (${game?.players.length}/4) : ${playerList}`)
            .setColor(0x00FF00);
        await interaction.reply({ embeds: [embed] });
    } else {
        await interaction.reply({ content: "Impossible de rejoindre la partie. Soit elle a déjà commencé, soit elle est complète, soit vous n'avez pas de lobby ouvert dans ce salon.", ephemeral: true });
    }
  }
};

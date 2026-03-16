import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player, PlayerColor } from '../../core/types.js';

export const joinCommand = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins an existing game lobby'),

  async execute(interaction: CommandInteraction, gameManager: GameManager) {
    const user = interaction.user;
    
    const colors: PlayerColor[] = ["RED", "BLUE", "WHITE", "ORANGE"];
    const currentColorIndex = gameManager.getGame().players.length % colors.length;
    const assignedColor = colors[currentColorIndex];

    const player: Player = {
        id: user.id,
        username: user.username,
        color: assignedColor,
        resources: {
            'WOOD': 0, 'BRICK': 0, 'SHEEP': 0, 'WHEAT': 0, 'ORE': 0
        },
        devCards: {knights: 0, victoryPoints: 0, special: []},
        stock: { roads: 15, settlements: 5, cities: 4 },
        victoryPoints: 0
    };

    const success = gameManager.joinGame(interaction.channelId, player);

    if (success.success) {
        const game = gameManager.getGame();
        const playerList = game?.players.map(p => p.username).join(', ');
        const embed = new EmbedBuilder()
            .setTitle("Les Colons de Catane - Lobby")
            .setDescription(`${user.username} a rejoint la partie !
Joueurs (${game?.players.length}/4) : ${playerList}`)
            .setColor(0x00FF00);
        await interaction.reply({ embeds: [embed] });
    } else {
        await interaction.reply({ content: `Impossible de rejoindre la partie : ${success.error?.details}`, ephemeral: true });     
    }
  }
};

<<<<<<< HEAD
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player, PlayerColor } from '../../core/types.js';

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


    const player: Player = {
        id: user.id,
        username: user.username,


        resources: {
            'WOOD': 0, 'BRICK': 0, 'SHEEP': 0, 'WHEAT': 0, 'ORE': 0
        },

        devCards: [],


        color: PlayerColor ,


        stock: { roads: 0, settlements: 0, cities: 0 },


        victoryPoints: 0
    };


    gameManager.createGame(interaction.channelId, player);


    const embed = new EmbedBuilder()
        .setTitle("Les Colons de Catane - Nouveau Lobby")

        .setDescription(`${user.username} a ouvert un lobby ! Utilisez \`/join\` pour le rejoindre.`)
        .setColor(0x0099FF);

=======
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
>>>>>>> catan
    await interaction.reply({ embeds: [embed] });
  }
};


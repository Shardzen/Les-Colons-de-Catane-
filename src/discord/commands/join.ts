﻿import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player, PlayerColor } from '../../core/types.js';

export const joinCommand = {
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins an existing game lobby'),
  
  // Fonction exécutée quand un utilisateur lance la commande /join
  async execute(interaction: CommandInteraction, gameManager: GameManager) {

    // Récupère l'utilisateur Discord qui a déclenché la commande
    const user = interaction.user;

    
    const player: Player = {
        id: user.id,               
        username: user.username,   
        
        color: PlayerColor,

       
        resources: {
            'WOOD': 0, 'BRICK': 0, 'SHEEP': 0, 'WHEAT': 0, 'ORE': 0
        },

        
        devCards: [],

    
        stock: { roads: 0, settlements: 0, cities: 0 },

        victoryPoints: 0
    };

    // Ajoute joueur à la partie en cours dans ce salon Discord
    const success = gameManager.joinGame(interaction.channelId, player);
    
    if (success) {
        // Récupère l'état actuel de la partie pour afficher la liste des joueurs
        const game = gameManager.getGame(interaction.channelId);

        // Construit la liste des noms de joueurs séparés par des virgules
        const playerList = game?.players.map(p => p.username).join(', ');

    
        const embed = new EmbedBuilder()
            .setTitle("Les Colons de Catane - Lobby")
            .setDescription(`${user.username} a rejoint la partie !
            Joueurs (${game?.players.length}/4) : ${playerList}`) 
            .setColor(0x00FF00); 

        
        await interaction.reply({ embeds: [embed] });
    } else {
       
        await interaction.reply({ 
            content: "Impossible de rejoindre la partie. Soit elle a déjà commencé, soit elle est complète, soit vous n'avez pas de lobby ouvert dans ce salon.", 
            ephemeral: true  
        });
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

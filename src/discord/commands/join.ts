<<<<<<< HEAD
﻿import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
=======
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
>>>>>>> command
import { GameManager } from '../../core/gameManager.js';
import { Player, PlayerColor } from '../../core/types.js';

export const joinCommand = {

  // Définition de la commande slash Discord : nom "/join" et description affichée dans l'interface
  data: new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins an existing game lobby'),
<<<<<<< HEAD

=======
  
  // Fonction exécutée quand un utilisateur lance la commande /join
>>>>>>> command
  async execute(interaction: CommandInteraction, gameManager: GameManager) {

    // Récupère l'utilisateur Discord qui a déclenché la commande
    const user = interaction.user;
<<<<<<< HEAD
    
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
=======

    // Joueur analysé par les données du serveur Discord
    const player: Player = {
        id: user.id,               // Identifiant unique Discord de l'utilisateur
        username: user.username,   // Nom affiché dans Discord
        
        // Chaque valeur pour chaque couleur, chaque valeur selon un tableau.
        color: PlayerColor["BLUE", "RED"],

        // Ressources : initialisées à 0 (bois, argile, mouton, blé, minerai).
        resources: {
            'WOOD': 0, 'BRICK': 0, 'SHEEP': 0, 'WHEAT': 0, 'ORE': 0
        },

        // Cartes de développement initiales : valeurs initialisées à 0
        devCards: { knights: 0, victoryPoints: 0, special: [] },

        // Valeurs initialisées à 0 car au départ il n'y a aucun stock disponible
        stock: { roads: 0, settlements: 0, cities: 0 },

        // Points de victoire de départ
>>>>>>> command
        victoryPoints: 0
    };

    // Ajoute joueur à la partie en cours dans ce salon Discord
    const success = gameManager.joinGame(interaction.channelId, player);
<<<<<<< HEAD

    if (success.success) {
        const game = gameManager.getGame();
=======
    
    if (success) {
        // Récupère l'état actuel de la partie pour afficher la liste des joueurs
        const game = gameManager.getGame(interaction.channelId);

        // Construit la liste des noms de joueurs séparés par des virgules
>>>>>>> command
        const playerList = game?.players.map(p => p.username).join(', ');

        // Construit l'embed de confirmation visible par tous dans le salon
        const embed = new EmbedBuilder()
            .setTitle("Les Colons de Catane - Lobby")
            .setDescription(`${user.username} a rejoint la partie !
            Joueurs (${game?.players.length}/4) : ${playerList}`) // Affiche le nombre de joueurs et leurs noms
            .setColor(0x00FF00); // Vert : confirmation visuelle que le joueur a bien rejoint

        // Affiche une réponse dans le salon
        await interaction.reply({ embeds: [embed] });
    } else {
<<<<<<< HEAD
        await interaction.reply({ content: `Impossible de rejoindre la partie : ${success.error?.details}`, ephemeral: true });     
=======
        // Si partie déjà commencée
        await interaction.reply({ 
            content: "Impossible de rejoindre la partie. Soit elle a déjà commencé, soit elle est complète, soit vous n'avez pas de lobby ouvert dans ce salon.", 
            ephemeral: true  // true = condition vraie pour afficher message à l'utilisateur
        });
>>>>>>> command
    }
  }
};
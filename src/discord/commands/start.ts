import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player } from '../../core/types.js';

export const startCommand = {

  // Définition de la commande slash : "/start" avec sa description affichée dans Discord
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Starts a new game lobby for Les Colons de Catane'),
  
  // Fonction exécutée quand un utilisateur lance la commande /start
  async execute(interaction: CommandInteraction, gameManager: GameManager) {

    // Récupère l'utilisateur Discord qui a déclenché la commande
    const user = interaction.user;

    // Construit l'objet joueur fondateur du lobby avec ses valeurs initiales
    const player: Player = {
        id: user.id,             // Identifiant unique Discord de l'utilisateur
        username: user.username, // Nom affiché dans Discord

        // Ressources de départ : toutes à 0 (bois, argile, mouton, blé, minerai)
        resources: {
            'WOOD': 0, 'BRICK': 0, 'SHEEP': 0, 'WHEAT': 0, 'ORE': 0
        },

        // Valeur intiale de 0
        devCards: [],

        // Reçoit une couleur, censé afficher toutes les couleurs au départ, initialisation juste avec le bleu.
        color: RED ,

        // Stock de pièces disponibles à 0 au début
        stock: { roads: 0, settlements: 0, cities: 0 },

        // Points de victoire de départ
        victoryPoints: 0
    };

    // Crée une nouvelle partie associée au salon Discord où la commande a été lancée
    gameManager.createGame(interaction.channelId, player);
    
    // Création embed qui affiche des messages dans le serveur
    const embed = new EmbedBuilder()
        .setTitle("Les Colons de Catane - Nouveau Lobby")
        // Affiche un message pour comprendre qui a commencé la partie
        .setDescription(`${user.username} a ouvert un lobby ! Utilisez \`/join\` pour le rejoindre.`)
        .setColor(0x0099FF); // setColor affiche la couleur de l'utilisateur a choisi au départ

    // Envoie une réponse  dans le salon
    await interaction.reply({ embeds: [embed] });
  }
};

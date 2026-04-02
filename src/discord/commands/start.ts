import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player, PlayerColor } from '../../core/types.js';

export const startCommand = {

  // Définition de la commande slash : "/start" avec sa description affichée dans Discord
  data: new SlashCommandBuilder()
    .setName('start')
    .setDescription('Starts a new game lobby for Les Colons de Catane'),
  
  // Fonction exécutée quand un utilisateur lance la commande /start
  async execute(interaction: CommandInteraction, gameManager: GameManager) {

    // Récupère l'utilisateur Discord qui a déclenché la commande
    const user = interaction.user;

    
    const player: Player = {
        id: user.id,            
        username: user.username, 

        
        resources: {
            'WOOD': 0, 'BRICK': 0, 'SHEEP': 0, 'WHEAT': 0, 'ORE': 0
        },

        // Valeur intiale de 0
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

    // Envoie une réponse  dans le salon
    await interaction.reply({ embeds: [embed] });
  }
};

import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { renderBoardEmoji } from '../../core/boardRenderer.js';

export const beginCommand = {

  data: new SlashCommandBuilder()
    .setName('begin')
    .setDescription('Starts the game from the current lobby'),
  
  // Fonction exécutée quand un utilisateur lance la commande /begin
  async execute(interaction: CommandInteraction, gameManager: GameManager) {


    const success = gameManager.startGame(interaction.channelId);
    
    if (success) {
        const game = gameManager.getGame(interaction.channelId)!;

 
        const boardRender = renderBoardEmoji(game.board.hexes);

        const rollButton = new ButtonBuilder()
            .setCustomId('roll_dice')  
            .setLabel('Lancer les Dés') 
            .setStyle(ButtonStyle.Primary); 
        
        // Créer ActionRow de type row qui va afficher les boutons à affucher  
        // ajout d'une fonction Components qui permet lancer les dés
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(rollButton);
        
        const embed = new EmbedBuilder()
            .setTitle("Les Colons de Catane - La partie commence !")
            .setDescription(
                `Le plateau est généré !\n\n` +
                `${boardRender}\n\n` +
                `C'est au tour de ${game.players[game.currentPlayerIndex]?.username} de jouer !` 
            )
            .setColor(0xFFA500); // Couleur de l'affichage 

        // Affiche le texte du dessus par la fonction embed créée juste en haut
        await interaction.reply({ embeds: [embed], components: [row] });

    } else {
        await interaction.reply({ 
            content: "Impossible de lancer la partie. Il faut au moins 2 joueurs dans le lobby.", 
            ephemeral: true 
        });
    }
  }
};

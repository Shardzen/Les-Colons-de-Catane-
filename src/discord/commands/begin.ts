﻿import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { renderBoardEmoji } from '../../core/boardRenderer.js';

export const beginCommand = {

  // Définition de la commande slash : "/begin" pour lancer la partie depuis le lobby
  data: new SlashCommandBuilder()
    .setName('begin')
    .setDescription('Starts the game from the current lobby'),
  
  // Fonction exécutée quand un utilisateur lance la commande /begin
  async execute(interaction: CommandInteraction, gameManager: GameManager) {

    // Tente de démarrer la partie dans le salon courant.
    // Retourne false s'il n'y a pas assez de joueurs ou si la partie est déjà lancée.
    const success = gameManager.startGame(interaction.channelId);
    
    if (success) {
        // Récupère l'état complet de la partie nouvellement démarrée
        const game = gameManager.getGame(interaction.channelId)!;

        // Génère la représentation visuelle du plateau de jeu en emojis
        const boardRender = renderBoardEmoji(game.board.hexes);
      
        // Crée un bouton cliquable "Lancer les Dés" que le joueur courant devra utiliser
        const rollButton = new ButtonBuilder()
            .setCustomId('roll_dice')  // Identifiant utilisateur qui lance les dés
            .setLabel('Lancer les Dés') // Affiche texte "Lancer les Dés"
            .setStyle(ButtonStyle.Primary); // Affiche bouton
        
        // Créer ActionRow de type row qui va afficher les boutons à affucher  
        // ajout d'une fonction Components qui permet lancer les dés
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(rollButton);
        
        // Construit l'embed d'annonce du début de partie avec :
        // - le plateau de jeu en emojis
        // - l'indication du premier joueur à jouer
        const embed = new EmbedBuilder()
            .setTitle("Les Colons de Catane - La partie commence !")
            .setDescription(
                `Le plateau est généré !\n\n` +
                `${boardRender}\n\n` + // Plateau emoji au centre du message
                `C'est au tour de ${game.players[game.currentPlayerIndex]?.username} de jouer !` // Joueur actuel dépend de l'ID du joueur
            )
            .setColor(0xFFA500); // Couleur de l'affichage 

        // Affiche le texte du dessus par la fonction embed créée juste en haut
        await interaction.reply({ embeds: [embed], components: [row] });

    } else {
        // Réponse affichée si partie disponible
        // Si impossible lancer partie avec true pour que la condition soit vraie, donc l'afficher
        await interaction.reply({ 
            content: "Impossible de lancer la partie. Il faut au moins 2 joueurs dans le lobby.", 
            ephemeral: true 
        });
    }
  }
};

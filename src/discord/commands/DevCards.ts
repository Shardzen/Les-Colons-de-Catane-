//Fonction qui assignée pour ccréer un deck de cartes qui servira dans la partie avec implémentation ensuite d'effets spéciaux 
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player } from '../../core/types.js';

export const DevCardsCommand = {
            data: new SlashCommandBuilder()
                .setName("Deckcards")
                .setDescription("Affiche le deck"),


//Utilise les memes methodes d'exécution des autres modes de jeu
async execute(interaction: CommandInteraction, gameManager: GameManager) {

    //Importer la classe Joueur pour affecter valeurs au(x) joueur(s)
    const user = interaction.user;
     const player: Player = {
            id: user.id,
            username: user.username,
            devCards: {
                knights: 0,
                victoryPoints: 0,
                special: []
            }
        };

   //Créer un nouveau deck de type deck 
        const deck = NewDeck();

        // Mélange le deck 
        shuffle(deck);

    await interaction.reply(`Deck créé avec ${deck} cartes`);

}
}



//Fonction qui assignée pour ccréer un deck de cartes qui servira dans la partie avec implémentation ensuite d'effets spéciaux 
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player } from '../../core/types.js';


export const DevCardsCommand = {
            data: new SlashCommandBuilder()
                .setName("Deck cards")
                .setDescription("Affiche le deck"),


//Utilise les memes methodes d'exécution des autres modes de jeu
async execute(interaction: CommandInteraction, gameManager: GameManager) {

    const user = interaction.user;

    // Joueur analysé par les données du serveur Discord
    const player: Player = {
        id: user.id,               
        username: user.username,  
        devCards: { knights: 0, victoryPoints: 0, special: [] 

        },  
    }
    player.devCards();
}
}

class DevCards  {

}




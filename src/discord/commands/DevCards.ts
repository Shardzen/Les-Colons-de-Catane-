//Fonction qui assignée pour ccréer un deck de cartes qui servira dans la partie avec implémentation ensuite d'effets spéciaux 
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player, PlayerColor } from '../../core/types.js';


//Propre au fichier 

export type Player2 = Player & {color: PlayerColor | null}

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
            color: PlayerColor,
            resources: {
                    WOOD: 0,
                    BRICK: 0,
                    SHEEP: 0,
                    WHEAT: 0,
                    ORE: 0,
                        },
            victoryPoints: 0,
            stock: {
                    roads: 15,
                    settlements: 5,
                    cities: 4,
                        },
            devCards: []
        };

       


    const deck = NewDeck();

    function NewDeck(): DevCard[] { 
        for (let i = 0; i < 14; i++) { //14 cartes chevaliers disponibles
        deck.push({
      type: "knight",
      played : false,
      turn: 0
    });
  }
            for (let i = 0; i < 5; i++) { //5 cartes PV
            deck.push({
            type: "victory",
            victoryPoints: 1,
            played : false,
            turn: 0
    });
  }
    }


        // Mélange le deck 
        function shuffle(deck: DevCard[]): DevCard[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Fonction qui affiche un nombre aléatoire de 0 à 1
  }
        return deck;
}
    const deck = shuffle(NewDeck());
    await interaction.reply(`Deck créé avec ${deck.length} cartes`);
}
}






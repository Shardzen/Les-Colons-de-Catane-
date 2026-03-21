//Fonction qui assignée pour ccréer un deck de cartes qui servira dans la partie avec implémentation ensuite d'effets spéciaux 
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { PlayerColor, ResourceMap, DevCard } from '../../core/types.js';


//Créer fonction export pour la différencier de la classe PLayer du fichier d'origine
//Propre au fichier 
export interface Player {
  id: string;
  username: string;
  color: PlayerColor | null; // ← ici
  resources: ResourceMap;
  victoryPoints: number;
  stock: {
    roads: number;
    settlements: number;
    cities: number;
  };
  devCards: DevCard[];
}


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
            color: null,
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

       


   //Créer un nouveau deck de type deck 
    const deck = NewDeck();

    function NewDeck(): DevCard[] {

    }


        // Mélange le deck 
        function shuffle(deck: DevCard[]): DevCard[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
  }
        return deck;
}
    const deck = shuffle(NewDeck());
    await interaction.reply(`Deck créé avec ${deck.length} cartes`);
}
}






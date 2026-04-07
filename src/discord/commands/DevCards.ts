import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player, PlayerColor, DevCard } from '../../core/types.js';



export type Player2 = Player & {color: PlayerColor | null}

export const DevCardsCommand = {
            data: new SlashCommandBuilder()
                .setName("Deckcards")
                .setDescription("Affiche le deck"),



async execute(interaction: CommandInteraction, gameManager: GameManager) {

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
    const deck: DevCard[] = []
        for (let i = 0; i < 14; i++) {
        deck.push({
      type: "knight",
      played : false,
      turn: 0
    });
  }
            for (let i = 0; i < 5; i++) {
            deck.push({
            type: "victory",
            victoryPoints: 1,
            played : false,
            turn: 0
    });
  }

  
    const embed = new EmbedBuilder()
      .setTitle("🃏 Cartes de Développement")
      .setColor(0x8E44AD)
      .setDescription("Ces cartes offrent des bonus puissants ou des points de victoire.")
      .addFields(
        { name: "⚔️ Chevalier", value: "Permet de déplacer le voleur et de voler une ressource." },
        { name: "📜 Progrès", value: "Donne des bonus (Construction de routes, Monopole, Invention)." },
        { name: "🏆 Point de Victoire", value: "Donne **1 PV** caché." },
        { name: "🏗️ Coût", value: "⛰️1 Minerai + 🐑1 Laine + 🌾1 Blé" }
      )
      .setFooter({ text: "Utilisez les boutons de jeu pour acheter une carte." });

    await interaction.reply({ embeds: [embed] });
  }
};

  for (let i = 0; i < 2; i++) { //
            deck.push({
            type: "progress",
            effect: {type :"roadBuilding"},
             played : false,
            turn: 0
    })
  }

  for (let i = 0; i < 2; i++) { //
            deck.push({
            type: "progress",
            effect: {type :"yearOfPlenty"},
             played : false,
            turn: 0
    })
  }
  for (let i = 0; i < 2; i++) { //
            deck.push({
            type: "progress",
            effect: {type :"monopoly"},
             played : false,
            turn: 0
    })
  }

  function shuffle(deck: DevCard[]): DevCard[] {
       for (let i = deck.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         let temp = deck [i]
         deck [i] = deck [j]
         deck [j] = temp
                }
        return deck;
}
function pickCard(deck: DevCard[], player: Player) : DevCard  {

  if (deck.length === 0) {
   throw new Error("Le deck est vide") //throw car ici programme attend DevCard
                         }
      const card = deck.shift()!
      player.devCards.push(card)

return card
}


function playCard(card: DevCard, player: Player): DevCard {

if (card.played === true) {
    throw new Error("Cette carte a déjà été jouée")
}

card.played = true

switch (card.type) {
    case "knight": // A faire dans le GamManager
        break
    case "victory":
      player.victoryPoints = player.victoryPoints + 1
        break
    case "progress": // A faire dans le GamManager
          switch (card.effect.type) {
        case "roadBuilding":
            break
        case "yearOfPlenty":
            break
        case "monopoly":
            break
    }
        break
}
return card
}

      return deck;





}
await interaction.reply(`Deck créé avec ${deck.length} cartes`);
}
}




>>>>>>> f83435251c940ea34779918beee3de80176bf30b

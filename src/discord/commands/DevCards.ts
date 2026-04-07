import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';

export const devCardsCommand = {
  data: new SlashCommandBuilder()
    .setName('devcards')
    .setDescription('Gérer et acheter des cartes de développement'),

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

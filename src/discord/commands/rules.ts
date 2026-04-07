import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from "discord.js";

export const rulesCommand = {

  data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Affiche les règles du jeu"),

  async execute(interaction: CommandInteraction) {

    const embed = new EmbedBuilder()
      .setTitle("📜 Règles des Colons de Catane")
      .setColor(0xE8A838)

      .addFields(
        {
          name: "🎯 Objectif",
          value: "Le premier joueur à atteindre **10 points de victoire** gagne la partie."
        },
        {
          name: "🔄 Tour de jeu",
          value: "1. Lancer les dés\n2. Collecter les ressources\n3. Construire / Échanger\n4. Passer le tour"
        },
        {
          name: "🏗️ Constructions",
          value: "• **Route** : 1 Bois + 1 Brique\n• **Village** : 1 Bois + 1 Brique + 1 Blé + 1 Mouton\n• **Ville** : 2 Blé + 3 Minerai"
        },
        {
          name: "🎲 Le 7 - Le Voleur",
          value: "Si le total des dés est **7**, le voleur se déplace. Les joueurs avec plus de 7 ressources doivent en défausser la moitié."
        },
        {
          name: "🏆 Points de victoire",
          value: "• Village : **1 PV**\n• Ville : **2 PV**\n• Route la plus longue (5+) : **2 PV**\n• Armée la plus puissante (3+) : **2 PV**"
        }
      )

<<<<<<< HEAD
=======

>>>>>>> catan
      .setFooter({ text: "Bonne chance à tous !" });

    await interaction.reply({ embeds: [embed] });
  }
};
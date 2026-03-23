import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';

export const robberCommand = {
  data: new SlashCommandBuilder()
    .setName("robber")
    .setDescription("Règles et état du voleur"),

  async execute(interaction: CommandInteraction, currentGame: any) {
    const embed = new EmbedBuilder()
      .setTitle("😈 Le Voleur")
      .setColor(0x333333)
      .addFields(
        { name: "📉 Défausse", value: "Sur un **7**, tout joueur ayant plus de **7 ressources** défausse la moitié." },
        { name: "🗺️ Position actuelle", value: currentGame ? `Sur la case **${currentGame.map.find((h:any) => h.hasRobber)?.id || "Désert"}**` : "Aucune partie en cours." },
        { name: "💰 Action", value: "Le voleur bloque la production et permet de voler une ressource." }
      )
      .setFooter({ text: "Catan Bot - Logiciel par Arthur (Tech Lead)" });

    await interaction.reply({ embeds: [embed] });
  }
};

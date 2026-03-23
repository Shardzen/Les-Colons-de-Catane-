import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';

export const robberCommand = {
  data: new SlashCommandBuilder()
    .setName("robber")
    .setDescription("Information sur les règles du voleur"),

  async execute(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
      .setTitle("😈 Le Voleur (Le 7)")
      .setColor(0x333333)
      .setDescription(`Si quelqu'un lance un **7** au dés :`)
      .addFields(
        { name: "📉 Défausse", value: "Tout joueur ayant plus de **7 ressources** doit défausser la moitié de ses cartes (arrondi à l'inférieur)." },
        { name: "🗺️ Déplacement", value: "Le joueur actif déplace le Voleur sur une nouvelle case." },
        { name: "🚫 Blocage", value: "La case occupée par le Voleur ne produit plus de ressources." },
        { name: "💰 Vol", value: "Le joueur actif peut voler une ressource au hasard à un joueur ayant un bâtiment sur la case." }
      )
      .setFooter({ text: "Catan Bot - Système automatisé" });

    await interaction.reply({ embeds: [embed] });
  }
};

import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';

export const devCardsCommand = {
  data: new SlashCommandBuilder()
    .setName('devcards')
    .setDescription('Gérer et acheter des cartes de développement'),

  async execute(interaction: CommandInteraction, currentGame: any) {
    if (!currentGame) {
      return interaction.reply({ content: "Aucune partie en cours.", ephemeral: true });
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

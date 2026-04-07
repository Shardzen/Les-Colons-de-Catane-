import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { CatanEngine } from "../../CatanEngine.js";
import { DevCardType, ResourceType } from "../../core/types.js";

export const DevCardsCommand = {
  data: new SlashCommandBuilder().setName("devcards").setDescription("Gérer tes cartes de développement"),
  async execute(interaction: CommandInteraction, engine: CatanEngine) {
    const p = engine.players.find(pl => pl.id === interaction.user.id);
    if (!p) return interaction.reply({ content: "Pas dans la partie.", ephemeral: true });
    if (p.devCards.length === 0) return interaction.reply({ content: "Aucune carte.", ephemeral: true });

    const s = new StringSelectMenuBuilder().setCustomId("play_dev").setPlaceholder("Jouer une carte");
    p.devCards.forEach((c, i) => s.addOptions({ label: `${c} (#${i})`, value: `${c}_${i}` }));

    await interaction.reply({ content: "?? Tes cartes :", components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)], ephemeral: true });
  }
};


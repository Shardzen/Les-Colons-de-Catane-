import { SlashCommandBuilder, CommandInteraction } from 'discord.js';

export const beginCommand = {
  data: new SlashCommandBuilder()
    .setName('begin')
    .setDescription('Lancer la partie de Catane'),

  async execute(interaction: CommandInteraction, lobbyPlayers: any[], startGameCallback: Function) {
    if (lobbyPlayers.length < 2) {
      return interaction.reply({ 
        content: "Il faut au moins 2 joueurs pour commencer !", 
        ephemeral: true 
      });
    }

    // On délègue la création de la partie au callback (dans index.ts)
    // pour garder l'instance CatanEngine centralisée.
    await startGameCallback(interaction);
  }
};

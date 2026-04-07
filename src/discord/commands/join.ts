import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from "discord.js";

export const joinCommand = {
  data: new SlashCommandBuilder().setName("join").setDescription("Rejoindre le lobby"),
  async execute(interaction: CommandInteraction, currentGame: any, lobbyPlayers: any[]) {
    const user = interaction.user;
    if (currentGame) return interaction.reply({ content: "Partie en cours.", ephemeral: true });
    if (lobbyPlayers.find(p => p.id === user.id)) return interaction.reply({ content: "Déjà dans le lobby !", ephemeral: true });
    if (lobbyPlayers.length >= 4) return interaction.reply({ content: "Lobby complet.", ephemeral: true });

    const colors = ["#FF0000", "#0000FF", "#00FF00", "#FFA500"];
    const playerColor = colors[lobbyPlayers.length];
    lobbyPlayers.push({ id: user.id, username: user.username, color: playerColor });

    const embed = new EmbedBuilder()
        .setTitle("?? Catane - Lobby")
        .setDescription(`**${user.username}** a rejoint !\n\n**Joueurs (${lobbyPlayers.length}/4) :**\n${lobbyPlayers.map(p => p.username).join(", ")}`)
        .setColor(playerColor as any)
        .setFooter({ text: "/begin pour lancer !" });
    await interaction.reply({ embeds: [embed] });
  }
};


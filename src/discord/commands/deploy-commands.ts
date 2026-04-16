import { REST, Routes, SlashCommandBuilder } from "discord.js";
import 'dotenv/config';

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

const commandsData = [
  new SlashCommandBuilder().setName('start').setDescription('Ouvrir un lobby'),
  new SlashCommandBuilder().setName('join').setDescription('Rejoindre le lobby'),
  new SlashCommandBuilder().setName('begin').setDescription('Lancer la partie'),
  new SlashCommandBuilder().setName('cards').setDescription('Voir tes ressources'),
  new SlashCommandBuilder().setName('rules').setDescription('Affiche les règles du jeu'),
].map(cmd => cmd.toJSON());

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, guildId),
      { body: commandsData }
    );
  } catch (error) {
    console.error(error);
  }
}

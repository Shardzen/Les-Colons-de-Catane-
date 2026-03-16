import { REST, Routes, SlashCommandBuilder } from "discord.js";
import 'dotenv/config'

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID!, guildId),
      {
        body: commandsData,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}
const JoinCommand = new SlashCommandBuilder()
                .setName('join')
                .setDescription('Joins an existing game')

const StartCommand = new SlashCommandBuilder()
                .setName('start')
                .setDescription('Start new game')

const BuildCommand = new SlashCommandBuilder()
  .setName('build')
  .setDescription('Build something')
  .addStringOption(opt =>
    opt.setName('type')
      .setDescription('What do you want to build ?')
      .setRequired(true)
      .addChoices(
        { name: 'CITY', value: 'CITY' },
        { name: 'ROAD', value: 'ROAD' },
        { name: 'SETTLEMENT', value: 'SETTLEMENT' }
      )
  )
      .addStringOption(opt =>opt.setName('coords')
      .setDescription('Coordinates')
      .setRequired(true)
          );
          

const commandsData = [JoinCommand, StartCommand, BuildCommand].map(cmd => cmd.toJSON());
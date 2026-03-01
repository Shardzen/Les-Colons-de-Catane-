import { REST, Routes, SlashCommandBuilder } from "discord.js";
import 'dotenv/config'

const commandsData = [join, start, build].map(cmd => cmd.data.toJSON());

const command = new SlashCommandBuilder()
                .setName('join')
                .setDescription('Joins an existing game'),

const command = new SlashCommandBuilder()
                .setName('start')
                .setDescription('Start new game'),

const command = new SlashCommandBuilder()
                .setName('build')
                .setDescription('Build something')
                .addStringOption(opt=>opt.setName('type'))
                .setDescription('What do you want to build ?')
                .setRequired(true)
                .addChoices(
                 { name: 'CITY', value: 'CITY' },
                { name: 'ROAD', value: 'ROAD' },
                { name: 'SETTLEMENT', value: 'SETTLEMENT' }
                  )
                .addCoords(opt=>opt.setName('coords'))
                .setDescription()
                .SetRequired(true),
                

//async function attendre réponse du net
const rest = new REST({ version: "10" }).setToken(config.DISCORD_TOKEN);

type DeployCommandsProps = {
  guildId: string;
};

export async function deployCommands({ guildId }: DeployCommandsProps) {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(config.DISCORD_CLIENT_ID, guildId),
      {
        body: commandsData,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
}
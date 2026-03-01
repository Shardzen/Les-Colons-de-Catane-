import { REST, Routes, SlashCommandBuilder } from "discord.js";
import 'dotenv/config'

// Ton tableau commandsData utilise les variables join, start et build avant même que tu les aies créées plus bas. 
// L'ordinateur lit de haut en bas, donc il va te dire qu'elles n'existent pas. 
// Déplace ton tableau tout en bas du fichier.

const commandsData = [join, start, build].map(cmd => cmd.data.toJSON());

// Tu as créé trois variables qui s'appellent toutes const command. 
// En programmation, c'est interdit : une constante doit avoir un nom unique.
// Utilise plutôt des noms clairs comme joinCommand, startCommand, etc., ou mets tout directement dans un tableau.
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
                .SetRequired(true), // Fais attention aux majuscules, .SetRequired doit être .setRequired.

              // La méthode .addCoords() n'existe pas dans la bibliothèque discord.js
              // Car discord.js n'existe pas alors tu dois le créer toi même.
              //  Pour les coordonnées, utilise un .addStringOption() classique. 
              // C'est mon moteur de jeu qui s'occupera de vérifier si le texte est correct après. 
                

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
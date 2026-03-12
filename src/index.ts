import { Client, GatewayIntentBits, Collection, REST, Routes } from "discord.js";
import { GameManager } from "./core/gameManager.js";
import { joinCommand } from "./discord/commands/join.js";
import { rulesCommand } from "./discord/commands/rules.js";
import { startCommand } from "./discord/commands/start.js";
//import { playCommand } from "./discord/commands/play.js";//

import "dotenv/config"

const TOKEN = process.env.DISCORD_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const gameManagers = new Map<string, GameManager>();

const commands = [joinCommand, rulesCommand, startCommand];

// Enregistrement des commandes slash
const rest = new REST().setToken(TOKEN);
await rest.put(Routes.applicationCommands(CLIENT_ID), {
  body: commands.map(cmd => cmd.data.toJSON())
});

client.once("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user?.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const channelId = interaction.channelId;
  if (!gameManagers.has(channelId)) {
    gameManagers.set(channelId, new GameManager([]));
  }

  const gameManager = gameManagers.get(channelId)!;

  const command = commands.find(cmd => cmd.data.name === interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, gameManager);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "Une erreur est survenue.", ephemeral: true });
  }
});


/* console.log("--- D�marrage du Core Engine Sandbox ---");

const testPlayers = [
  { id: "123", username: "Joueur 1", color: "RED" as const },
  { id: "456", username: "Joueur 2", color: "BLUE" as const }
];

const engine = new GameManager(testPlayers);
const state = engine.getState();

console.log(`Partie initialis�e ID: ${state.gameId}`);
console.log(`Nombre de tuiles g�n�r�es: ${state.board.tiles.length}`);
console.log(`Phase actuelle: ${state.phase}`);

// Simuler un lancer de d�s
console.log("\\nSimuler un lancer de d�s...");
const response = engine.execute({ type: "ROLL_DICE", playerId: "123" });

if (response.success) {
  console.log(`R�sultat: ${response.state.dice}`);
  console.log(`Nouvelle phase: ${response.state.phase}`);
} else {
  console.error(`Erreur: ${response.error?.details}`);
}

console.log("\\n--- Moteur pr�t pour int�gration ---");
*/
client.login(TOKEN);
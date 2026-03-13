import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, StringSelectMenuBuilder } from "discord.js";
import { config } from "dotenv";
import { CatanEngine } from "./CatanEngine.js";
import { MapRenderer } from "./MapRenderer.js";
import { GameState } from "./types.js";

config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

let currentGame: CatanEngine | null = null;
const pendingActions = new Map<string, any>();

function getLabel(index: number) {
    let label = "";
    while (index >= 0) {
        label = String.fromCharCode(65 + (index % 26)) + label;
        index = Math.floor(index / 26) - 1;
    }
    return label;
}

const commands = [
  new SlashCommandBuilder()
    .setName("start")
    .setDescription("Démarrer une nouvelle partie de Catane")
    .addUserOption(option => option.setName("joueur2").setDescription("Le 2ème joueur").setRequired(true))
    .addUserOption(option => option.setName("joueur3").setDescription("Le 3ème joueur"))
    .addUserOption(option => option.setName("joueur4").setDescription("Le 4ème joueur")),
  new SlashCommandBuilder()
    .setName("map")
    .setDescription("Afficher le plateau de jeu"),
];

async function updateBoard(interaction: any, message: string = "") {
    if (!currentGame) return;
    const buffer = await MapRenderer.renderMapToBuffer(currentGame);
    const attachment = new AttachmentBuilder(buffer, { name: 'catan-board.png' });
    
    const p = currentGame.currentPlayer;
    
    const row = new ActionRowBuilder<ButtonBuilder>();
    
    if (currentGame.state === GameState.PLAYING) {
        row.addComponents(
            new ButtonBuilder().setCustomId('roll_dice').setLabel('🎲 Lancer les dés').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('build_settlement').setLabel('🏠 Construire Colonie').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('build_road').setLabel('🛣️ Construire Route').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('end_turn').setLabel('⏭️ Fin de tour').setStyle(ButtonStyle.Secondary)
        );
    } else {
        row.addComponents(
            new ButtonBuilder().setCustomId('setup_settlement').setLabel('🏠 Placer Colonie').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('setup_road').setLabel('🛣️ Placer Route').setStyle(ButtonStyle.Success),
        );
    }

    const inventory = `🎒 **Ton inventaire** : 🌲${p.resources["Bois"]} 🧱${p.resources["Argile"]} 🐑${p.resources["Laine"]} 🌾${p.resources["Blé"]} ⛰️${p.resources["Minerai"]} | 🏆 ${p.victoryPoints} PV`;
    const fullMessage = `🎮 **Tour de <@${p.id}> !** [Phase: ${currentGame.state}]\n${inventory}\n\n${message}`;

    if (interaction.isRepliable() && !interaction.replied) {
        await interaction.reply({ content: fullMessage, files: [attachment], components: [row] });
    } else {
        await interaction.channel?.send({ content: fullMessage, files: [attachment], components: [row] });
    }
}

client.once("ready", async () => {
  console.log(`🤖 Bot connecté !`);
  if (process.env.DISCORD_TOKEN && process.env.CLIENT_ID) {
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("✅ Commandes chargées.");
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "start") {
        const u1 = interaction.user;
        const u2 = interaction.options.getUser("joueur2");
        const u3 = interaction.options.getUser("joueur3");
        const u4 = interaction.options.getUser("joueur4");

        const playersData = [
          { id: u1.id, username: u1.username, color: "#FF0000" },
          { id: u2!.id, username: u2!.username, color: "#0000FF" }
        ];
        if (u3) playersData.push({ id: u3.id, username: u3.username, color: "#00FF00" });
        if (u4) playersData.push({ id: u4.id, username: u4.username, color: "#FFA500" });

        currentGame = new CatanEngine(playersData);
        await updateBoard(interaction, "🎲 **La partie commence ! Phase de placement initial.**\nLe joueur 1 doit placer sa première colonie.");
      }
      
      if (interaction.commandName === "map") {
         await updateBoard(interaction);
      }
  }

  if (interaction.isButton()) {
      if (!currentGame) return;
      if (interaction.user.id !== currentGame.currentPlayer.id) {
          return interaction.reply({ content: "Ce n'est pas ton tour !", ephemeral: true });
      }

      const pId = interaction.user.id;

      if (interaction.customId === "roll_dice") {
          const res = currentGame.rollDice();
          let msg = `🎲 Dés : **${res.total}**\n`;
          if (res.isRobber) msg += "😈 Le voleur s'active ! (À implémenter : défausse & déplacement)\n";
          else {
              for (const [uname, gains] of Object.entries(res.harvests)) {
                  msg += `- ${uname} a récolté.\n`;
              }
          }
          await updateBoard(interaction, msg);
      }

      if (interaction.customId === "setup_settlement" || interaction.customId === "build_settlement") {
          const nodes = currentGame.getPlaceableNodes(pId);
          if (nodes.length === 0) return interaction.reply({ content: "Tu ne peux construire aucune colonie !", ephemeral: true });
          
          const optionsLimit = Math.min(25, nodes.length);
          const slicedNodes = nodes.slice(0, optionsLimit);
          
          const validSpots = slicedNodes.map((n, i) => ({ id: n.id, label: getLabel(i) }));
          pendingActions.set(pId, { type: 'settlement', spots: validSpots });

          const buffer = await MapRenderer.renderInteractiveMap(currentGame, validSpots, true);
          const attachment = new AttachmentBuilder(buffer, { name: 'catan-select.png' });

          const selectMenu = new StringSelectMenuBuilder()
              .setCustomId('select_spot')
              .setPlaceholder('Choisis un emplacement (A, B, C...)')
              .addOptions(validSpots.map(s => ({ label: `Emplacement ${s.label}`, value: s.id })));
          
          const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

          await interaction.reply({ content: "📍 **Où veux-tu placer ta colonie ?** Regarde les lettres sur la carte.", files: [attachment], components: [row], ephemeral: true });
      }

      if (interaction.customId === "setup_road" || interaction.customId === "build_road") {
          const edges = currentGame.getPlaceableEdges(pId);
          if (edges.length === 0) return interaction.reply({ content: "Tu ne peux construire aucune route !", ephemeral: true });
          
          const optionsLimit = Math.min(25, edges.length);
          const slicedEdges = edges.slice(0, optionsLimit);
          
          const validSpots = slicedEdges.map((e, i) => ({ id: e.id, label: getLabel(i) }));
          pendingActions.set(pId, { type: 'road', spots: validSpots });

          const buffer = await MapRenderer.renderInteractiveMap(currentGame, validSpots, false);
          const attachment = new AttachmentBuilder(buffer, { name: 'catan-select.png' });

          const selectMenu = new StringSelectMenuBuilder()
              .setCustomId('select_spot')
              .setPlaceholder('Choisis un emplacement (A, B, C...)')
              .addOptions(validSpots.map(s => ({ label: `Emplacement ${s.label}`, value: s.id })));
          
          const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

          await interaction.reply({ content: "📍 **Où veux-tu placer ta route ?** Regarde les lettres sur la carte.", files: [attachment], components: [row], ephemeral: true });
      }

      if (interaction.customId === "end_turn") {
          currentGame.nextTurn();
          await interaction.deferUpdate();
          await updateBoard(interaction, "Le tour passe au joueur suivant.");
      }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "select_spot") {
      if (!currentGame) return;
      const pId = interaction.user.id;
      const action = pendingActions.get(pId);
      if (!action) return;

      const selectedId = interaction.values[0];

      if (action.type === 'settlement') {
          if (currentGame.buildSettlement(pId, selectedId)) {
              // Note: Normalement il faudrait forcer la construction d'une route tout de suite après en SETUP
              await interaction.update({ content: "✅ Colonie construite !", components: [], files: [] });
              await updateBoard(interaction, `<@${pId}> a construit une Colonie ! (Construisez une route maintenant si c'est la phase de setup)`);
          } else {
              await interaction.update({ content: "❌ Construction impossible.", components: [], files: [] });
          }
      }

      if (action.type === 'road') {
          if (currentGame.buildRoad(pId, selectedId)) {
              if (currentGame.state === GameState.SETUP_1 || currentGame.state === GameState.SETUP_2) {
                  currentGame.nextTurn();
              }
              await interaction.update({ content: "✅ Route construite !", components: [], files: [] });
              await updateBoard(interaction, `<@${pId}> a construit une Route !`);
          } else {
              await interaction.update({ content: "❌ Construction impossible.", components: [], files: [] });
          }
      }
      
      pendingActions.delete(pId);
  }
});

client.login(process.env.DISCORD_TOKEN);

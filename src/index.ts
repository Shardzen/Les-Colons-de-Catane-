import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, StringSelectMenuBuilder, TextChannel, Message, EmbedBuilder, DEPRECATION_WARNING_PREFIX } from "discord.js";
import { config } from "dotenv";
import { CatanEngine } from "./CatanEngine.js";
import { MapRenderer } from "./MapRenderer.js";
import { GameState, ResourceType } from "./types.js";

config();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
let currentGame: CatanEngine | null = null, lobbyPlayers: any[] = [], pendingActions = new Map<string, any>();
const CHANNELS = { PLATEAU: process.env.CHANNEL_PLATEAU, JOURNAL: process.env.CHANNEL_JOURNAL, COMMERCE: process.env.CHANNEL_COMMERCE, LOGS: process.env.CHANNEL_LOGS };
let boardMessage: Message | null = null;
let longestRoadOwner: string | null = null;



function getLabel(i: number) { let l = ""; while (i >= 0) { l = String.fromCharCode(65 + (i % 26)) + l; i = Math.floor(i / 26) - 1; } return l; }
async function clearChannel(id: string | undefined) { if (!id) return; const c = client.channels.cache.get(id) as TextChannel; if (c) { try { const f = await c.messages.fetch({ limit: 100 }); await c.bulkDelete(f); } catch (e) {} } }

const commands = [
  new SlashCommandBuilder().setName("start").setDescription("Ouvrir un lobby"),
  new SlashCommandBuilder().setName("join").setDescription("Rejoindre le lobby"),
  new SlashCommandBuilder().setName("begin").setDescription("Lancer la partie"),
  new SlashCommandBuilder().setName("rules").setDescription("Afficher les règles détaillées"),
  new SlashCommandBuilder().setName("cards").setDescription("Voir tes ressources"),
  new SlashCommandBuilder().setName("map").setDescription("Afficher le plateau"),
  new SlashCommandBuilder().setName("finish").setDescription("Terminer la session"),
];

async function sendTurnDM(player : any, row : any, message : string) {
      console.log("sendTurnDM appelée pour", player.id);
try {
      const user = await client.users.fetch(player.id);

      await user.send({ content: message, components: [row] });
} catch (e) { console.log("Erreur DM:", e); }
}

async function sendWaitDM(player: any) {
    try {
        const user = await client.users.fetch(player.id);
        await user.send("⏳ Ce n'est pas encore ton tour...");
    } catch (e) {}
}



async function updateBoard(interaction?: any, logMsg: string = "") {
    if (!currentGame) return;
    try {
        const buffer = await MapRenderer.renderMapToBuffer(currentGame);
        const attachment = new AttachmentBuilder(buffer, { name: 'catan.png' });
        const p = currentGame.currentPlayer;
        if (CHANNELS.PLATEAU) {
            const pc = client.channels.cache.get(CHANNELS.PLATEAU) as TextChannel;
            if (pc) {
                const content = `🗺️ **Plateau** | Tour en cours> | <t:${Math.floor(Date.now()/1000)}:R>`;
                if (boardMessage) { try { await boardMessage.edit({ content, files: [attachment] }); } catch (e) { boardMessage = await pc.send({ content, files: [attachment] }); } }
                else boardMessage = await pc.send({ content, files: [attachment] });
            }
        }
        if (logMsg && CHANNELS.JOURNAL) { const c = client.channels.cache.get(CHANNELS.JOURNAL) as TextChannel; if (c) await c.send(`📖 **Journal** : ${logMsg}`); }

        const row = new ActionRowBuilder<ButtonBuilder>();
        if (currentGame.state === GameState.PLAYING) {
            if (!currentGame.hasRolled) row.addComponents(new ButtonBuilder().setCustomId('roll_dice').setLabel('🎲 Lancer les dés').setStyle(ButtonStyle.Primary));
            else {
                row.addComponents(
                    new ButtonBuilder().setCustomId('build_settlement').setLabel('🏠 Colonie').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('build_road').setLabel('🛣️ Route').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('build_city').setLabel('🏙️ Ville').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('trade_bank').setLabel('🤝 Commerce').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('end_turn').setLabel('⭐ Fin').setStyle(ButtonStyle.Secondary)
                );
            }
        } else if (currentGame.state === "ROBBER_MOVE") {
          row.addComponents(new ButtonBuilder().setCustomId('move_robber').setLabel('🦹 Déplacer le voleur').setStyle(ButtonStyle.Success));
        }
        else if (currentGame.state !== GameState.FINISHED) {
            if (currentGame.setupStep === "SETTLEMENT") row.addComponents(new ButtonBuilder().setCustomId('setup_settlement').setLabel('🏠 Placer Colonie').setStyle(ButtonStyle.Success));
            else row.addComponents(new ButtonBuilder().setCustomId('setup_road').setLabel('🛣️ Placer Route').setStyle(ButtonStyle.Success));
        }
        await sendTurnDM(currentGame.currentPlayer, row, "🎲 C'est ton tour");
        currentGame.players.forEach(async (player) => {
    if (player.id !== currentGame!.currentPlayer.id) {
        await sendWaitDM(player);
    }
});
        const msg = currentGame.state === GameState.FINISHED ? `🏆 Fin !` : `🎮 Tour en cours (${currentGame.state})`;
        if (interaction && interaction.isRepliable()) {
            if (interaction.replied || interaction.deferred) await interaction.editReply({ content: msg, components: [row], files: [] });
            else await interaction.reply({ content: msg, components: [row], ephemeral: true });
        } 
    } catch (e) {}
}

client.once("ready", async () => {
    console.log(`🤖 Bot connecté !`);
    const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
    if (process.env.GUILD_ID) await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID), { body: commands });
});

client.on("interactionCreate", async (i) => {
    try {
        if (i.isChatInputCommand()) {
            if (i.commandName === "finish") { await i.reply({ content: "🧼 Nettoyage...", ephemeral: true }); await clearChannel(CHANNELS.PLATEAU); await clearChannel(CHANNELS.JOURNAL); await clearChannel(CHANNELS.COMMERCE); currentGame = null; lobbyPlayers = []; boardMessage = null; return i.followUp({ content: "🏁 Terminé !" }); }
            if (i.commandName === "start") { lobbyPlayers = [{ id: i.user.id, username: i.user.username, color: "#FF0000" }]; await i.reply("🆕 Lobby ouvert ! /join pour rejoindre."); }
            if (i.commandName === "join") { if (lobbyPlayers.length >= 4 || lobbyPlayers.find((p:any) => p.id === i.user.id)) return i.reply({ content: "Erreur lobby", ephemeral: true }); const c = ["#0000FF", "#00FF00", "#FFA500"]; lobbyPlayers.push({ id: i.user.id, username: i.user.username, color: c[lobbyPlayers.length-1] }); await i.reply(`✅ <@${i.user.id}> a rejoint ! (${lobbyPlayers.length}/4)`); }
            if (i.commandName === "begin") { if (lobbyPlayers.length < 2) return i.reply("2 joueurs min."); currentGame = new CatanEngine(lobbyPlayers); boardMessage = null; await updateBoard(i, "La partie commence !"); }
            if (i.commandName === "cards") { if (!currentGame) return i.reply("Pas de partie."); const p = currentGame.players.find(p => p.id === i.user.id); if (!p) return i.reply("Pas dedans."); i.reply({ content: `🎒 Bois:${p.resources["Bois"]} Argile:${p.resources["Argile"]} Laine:${p.resources["Laine"]} Blé:${p.resources["Blé"]} Minerai:${p.resources["Minerai"]} | PV:${p.victoryPoints}`, ephemeral: true }); }
            if (i.commandName === "map") await updateBoard(i);
            if (i.commandName === "rules") {
                const embed = new EmbedBuilder()
                    .setTitle("📜 Manuel des Colons de Catane")
                    .setDescription("Bienvenue sur l'île de Catane ! Voici tout ce qu'il faut savoir pour devenir le maître de l'île.")
                    .addFields(
                        { name: "🎯 But du Jeu", value: "Soyez le premier à atteindre **10 Points de Victoire (PV)**." },
                        { name: "🏗️ Coûts de Construction", value: "🛣️ **Route** : 🌲1 Bois + 🧱1 Argile\n🏠 **Colonie** : 🌲1 Bois + 🧱1 Argile + 🐑1 Laine + 🌾1 Blé (Vaut **1 PV**)\n🏙️ **Ville** : ⛰️3 Minerais + 🌾2 Blés (Vaut **2 PV**)\n🃏 **Carte Dev** : ⛰️1 Minerai + 🐑1 Laine + 🌾1 Blé" },
                        { name: "🎲 Déroulement d'un tour", value: "1. **Récolte** : Lancez les dés. Si le total correspond à une case où vous avez un bâtiment, vous gagnez la ressource.\n2. **Commerce** : Échangez vos ressources avec la banque (4:1) ou les ports.\n3. **Construction** : Utilisez vos ressources pour bâtir et gagner des points." },
                        { name: "😈 Le Voleur (Le 7)", value: "Si vous faites un **7**, personne ne reçoit de ressources. Le joueur actif déplace le Voleur pour bloquer une case et voler une ressource à un adversaire." },
                        { name: "💡 Astuces", value: "- Les **Villes** rapportent double production (2 ressources au lieu d'une).\n- Respectez la **règle de distance** : il faut toujours 2 intersections vides entre chaque colonie." }
                    )
                    .setColor(0xE67E22)
                    .setFooter({ text: "Utilisez les boutons dans #commerce-public pour jouer !" });
                await i.reply({ embeds: [embed] });
            }
        }
                if (i.isButton()) {
                if (!currentGame)
                return i.reply({ content: "Pas de partie", ephemeral: true });
              
                if (i.user.id !== currentGame.currentPlayer.id)
                return i.reply({ content: "Pas ton tour !", ephemeral: true });

                  if (!currentGame)
                  return i.reply({ content: "Pas de partie", ephemeral: true });
                  if (i.user.id !== currentGame.currentPlayer.id && !pendingActions.has(i.user.id))
                  return i.reply({ content: "Pas ton tour !", ephemeral: true });
            if (i.customId === "roll_dice") { const res = currentGame.rollDice(); await i.deferUpdate(); await i.editReply({ components: [] }); await updateBoard(i, res ? `<@${i.user.id}> a fait un **${res.total}**.` : `<@${i.user.id}> a lancé les dés.`); }
            if (i.customId === "setup_settlement" || i.customId === "build_settlement") {
  
                const spots = currentGame.getPlaceableNodes(i.user.id).map((n, j) => ({ id: n.id, label: getLabel(j) }));
                pendingActions.set(i.user.id, { type: 'settlement', spots });
                const b = await MapRenderer.renderInteractiveMap(currentGame, spots.slice(0, 25), true);
                const s = new StringSelectMenuBuilder().setCustomId('select_spot').addOptions(spots.slice(0, 25).map(s => ({ label: `Pos ${s.label}`, value: s.id })));
                await i.update({ content: "🏠 Où ?", files: [new AttachmentBuilder(b, { name: 'catan.png' })], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)], ephemeral: true });
            }
            if (i.customId === "setup_road" || i.customId === "build_road") {
                const spots = currentGame.getPlaceableEdges(i.user.id).map((e, j) => ({ id: e.id, label: getLabel(j) }));
                pendingActions.set(i.user.id, { type: 'road', spots });
                const b = await MapRenderer.renderInteractiveMap(currentGame, spots.slice(0, 25), false);
                const s = new StringSelectMenuBuilder().setCustomId('select_spot').addOptions(spots.slice(0, 25).map(s => ({ label: `Pos ${s.label}`, value: s.id })));
                await i.update({ content: "🛣️ Où ?", files: [new AttachmentBuilder(b, { name: 'catan.png' })], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)], ephemeral: true });
            }
            if (i.customId === "build_city") {
                const spots = currentGame.getUpgradableSettlements(i.user.id).map((n, j) => ({ id: n.id, label: getLabel(j) }));
                pendingActions.set(i.user.id, { type: 'city', spots });
                const b = await MapRenderer.renderInteractiveMap(currentGame, spots.slice(0, 25), true);
                const s = new StringSelectMenuBuilder().setCustomId('select_spot').addOptions(spots.slice(0, 25).map(s => ({ label: `Pos ${s.label}`, value: s.id })));
                await i.update({ content: "🏙️ Améliorer ?", files: [new AttachmentBuilder(b, { name: 'catan.png' })], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)], ephemeral: true });
            }
             if (i.customId === "move_robber") {
              currentGame.state = GameState.PLAYING;

              await updateBoard(i, "Le voleur a été déplacé");
            }
            if (i.customId === "trade_bank") {
                const s = new StringSelectMenuBuilder().setCustomId('trade_give').addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT).map(r => ({ label: r, value: r })));
                await i.update({ content: "🤝 Donner 4 ?", components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)], ephemeral: true });
            }
            if (i.customId === "end_turn") { currentGame.nextTurn(); await i.deferUpdate(); await i.editReply({ components: [] });  await updateBoard(i, `<@${i.user.id}> a fini son tour.`); }
        }
        if (i.isStringSelectMenu()) {
      const action = pendingActions.get(i.user.id);
      if (!action) return i.reply({ content: "Action expirée", ephemeral: true });

              if (i.customId === "select_spot") {
              if (action.type === 'settlement' && currentGame!.buildSettlement(i.user.id, i.values[0])) {
              await i.update({ content: "✅ OK", components: [], files: [] });
              await updateBoard(null, `<@${i.user.id}> a posé une Colonie.`);
        }    else if (action.type === 'city' && currentGame!.buildCity(i.user.id, i.values[0])) {
              await i.update({ content: "✅ OK", components: [], files: [] });
              await updateBoard(null, `<@${i.user.id}> a posé une Ville.`);
        } else if (action.type === 'road' && currentGame!.buildRoad(i.user.id, i.values[0])) {
              await i.update({ content: "✅ OK", components: [], files: [] });
              await updateBoard(null, `<@${i.user.id}> a posé une Route.`);
              const longestRoad = currentGame!.calculateLongestRoad(i.user.id);
              if (longestRoad >= 5) {
                const player = currentGame!.players.find(p => p.id === i.user.id);
                player!.victoryPoints += 2;
              }
        }
        pendingActions.delete(i.user.id);
        return;
      }
            if (i.customId === 'trade_give') {
                const r = i.values[0] as ResourceType;
                const s = new StringSelectMenuBuilder().setCustomId(`trade_get_${r}`).addOptions(Object.values(ResourceType).filter(r2 => r2 !== ResourceType.DESERT && r2 !== r).map(r2 => ({ label: r2, value: r2 })));
                await i.update({ content: `Contre quoi ?`, components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)] });
            }
            if (i.customId.startsWith('trade_get_')) {
                const g = i.customId.replace('trade_get_', '') as ResourceType, r = i.values[0] as ResourceType;
                if (currentGame!.tradeWithBank(i.user.id, g, r)) { await i.update({ content: "✅ OK", components: [] }); await updateBoard(null, `<@${i.user.id}> a fait un échange.`); }
                else i.update({ content: "❌ Pas assez de ressources", components: [] });
            }
        }
    } catch (e) {}
});
client.login(process.env.DISCORD_TOKEN);

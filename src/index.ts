import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder, StringSelectMenuBuilder, TextChannel, Message, EmbedBuilder } from "discord.js";
import { config } from "dotenv";
import { CatanEngine } from "./CatanEngine.js";
import { MapRenderer } from "./MapRenderer.js";
import { GamePhase, ResourceType, DevCardType } from "./core/types.js";

config();
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
let currentGame: CatanEngine | null = null, lobbyPlayers: any[] = [], pendingActions = new Map<string, any>();
const CHANNELS = { PLATEAU: process.env.CHANNEL_PLATEAU, JOURNAL: process.env.CHANNEL_JOURNAL, COMMERCE: process.env.CHANNEL_COMMERCE };
let boardMessage: Message | null = null;
let longestRoadOwner: string | null = null;



function getLabel(i: number) { let l = ""; while (i >= 0) { l = String.fromCharCode(65 + (i % 26)) + l; i = Math.floor(i / 26) - 1; } return l; }
async function updateBoard(interaction?: any, logMsg: string = "") {
    if (!currentGame) return;
    try {
        const buffer = await MapRenderer.renderMapToBuffer(currentGame);
        const attachment = new AttachmentBuilder(buffer, { name: "catan.png" });
        const p = currentGame.currentPlayer;
        if (CHANNELS.PLATEAU) {
            const pc = client.channels.cache.get(CHANNELS.PLATEAU) as TextChannel;
            if (pc) {
                const content = `??? **Plateau** | Tour de <@${p.id}> | <t:${Math.floor(Date.now()/1000)}:R>`;
                if (boardMessage) { try { await boardMessage.edit({ content, files: [attachment] }); } catch (e) { boardMessage = await pc.send({ content, files: [attachment] }); } }
                else boardMessage = await pc.send({ content, files: [attachment] });
            }
        }
        if (logMsg && CHANNELS.JOURNAL) { const c = client.channels.cache.get(CHANNELS.JOURNAL) as TextChannel; if (c) await c.send(`?? **Journal** : ${logMsg}`); }
        const row = new ActionRowBuilder<ButtonBuilder>();
        if (currentGame.state === GamePhase.PLAYING) {
            if (!currentGame.hasRolled) row.addComponents(new ButtonBuilder().setCustomId("roll_dice").setLabel("?? Dés").setStyle(ButtonStyle.Primary));
            else {
                row.addComponents(
                    new ButtonBuilder().setCustomId("build_settlement").setLabel("?? Colonie").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("build_road").setLabel("??? Route").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("build_city").setLabel("??? Ville").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId("trade_btn").setLabel("?? Échange").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("end_turn").setLabel("? Fin").setStyle(ButtonStyle.Secondary)
                );
            }
        } else if (currentGame.state === GamePhase.ROBBER_MOVE) { row.addComponents(new ButtonBuilder().setCustomId("move_robber_btn").setLabel("?? Déplacer Voleur").setStyle(ButtonStyle.Danger)); }
        else if (currentGame.state === GamePhase.DISCARDING) { row.addComponents(new ButtonBuilder().setCustomId("discard_btn").setLabel("??? Défausse").setStyle(ButtonStyle.Danger)); }
        else if (currentGame.state !== GamePhase.FINISHED) {
            if (currentGame.setupStep === "SETTLEMENT") row.addComponents(new ButtonBuilder().setCustomId("setup_settlement").setLabel("?? Colonie").setStyle(ButtonStyle.Success));
            else row.addComponents(new ButtonBuilder().setCustomId("setup_road").setLabel("??? Route").setStyle(ButtonStyle.Success));
        }
        const msg = currentGame.state === GamePhase.FINISHED ? "?? Fin !" : `?? Tour de <@${p.id}> (${currentGame.state})`;
        if (interaction && interaction.isRepliable()) { if (interaction.replied || interaction.deferred) await interaction.editReply({ content: msg, components: [row], files: [] }); else await interaction.reply({ content: msg, components: [row] }); }
        else if (CHANNELS.COMMERCE) { const c = client.channels.cache.get(CHANNELS.COMMERCE) as TextChannel; if (c) await c.send({ content: msg, components: [row] }); }
        if (currentGame.players.some(p => p.victoryPoints >= 10)) {
            const w = currentGame.players.find(p => p.victoryPoints >= 10)!;
            if (CHANNELS.JOURNAL) { const c = client.channels.cache.get(CHANNELS.JOURNAL) as TextChannel; if (c) await c.send(`?? **VICTOIRE** : <@${w.id}> a gagné !`); }
            currentGame.state = GamePhase.FINISHED;
        }
    } catch (e) {}
}

client.on("interactionCreate", async (i) => {
    try {
        if (i.isChatInputCommand()) {
            if (i.commandName === "start") { lobbyPlayers = [{ id: i.user.id, username: i.user.username, color: "RED" }]; await i.reply("?? Lobby ouvert !"); }
            if (i.commandName === "join") { if (lobbyPlayers.length >= 4 || lobbyPlayers.find((p:any) => p.id === i.user.id)) return i.reply({ content: "Erreur", ephemeral: true }); lobbyPlayers.push({ id: i.user.id, username: i.user.username, color: ["BLUE", "WHITE", "ORANGE"][lobbyPlayers.length-1] }); await i.reply(`? <@${i.user.id}> a rejoint !`); }
            if (i.commandName === "begin") { if (lobbyPlayers.length < 2) return i.reply("2 min."); currentGame = new CatanEngine(lobbyPlayers); boardMessage = null; await updateBoard(i, "Start !"); }
            if (i.commandName === "inventory") { if (!currentGame) return i.reply("N/A"); const p = currentGame.players.find(p => p.id === i.user.id); if (!p) return i.reply("?"); i.reply({ content: `?? Bois:${p.resources[ResourceType.WOOD]} Argile:${p.resources[ResourceType.BRICK]} Mouton:${p.resources[ResourceType.SHEEP]} Blé:${p.resources[ResourceType.WHEAT]} Minerai:${p.resources[ResourceType.ORE]} | PV:${p.victoryPoints}`, ephemeral: true }); }
        }
        if (i.isButton()) {
            if (!currentGame) return;
            if (i.customId === "roll_dice") { const res = currentGame.rollDice(); if (res) { await i.deferUpdate(); await updateBoard(i, `<@${i.user.id}> a fait **${res.total}**.`); } }
            if (i.customId === "trade_btn") {
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId("trade_bank_init").setLabel("?? Banque (4:1)").setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId("trade_player_init").setLabel("?? Joueur").setStyle(ButtonStyle.Primary)
                );
                await i.reply({ content: "?? Type d\u0027échange :", components: [row], ephemeral: true });
            }
            if (i.customId === "trade_bank_init") {
                const s = new StringSelectMenuBuilder().setCustomId("trade_bank_give").addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT).map(r => ({ label: r, value: r })));
                await i.update({ content: "?? Donner quoi ?", components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)] });
            }
            if (i.customId === "trade_player_init") {
                const s = new StringSelectMenuBuilder().setCustomId("trade_p_give").addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT).map(r => ({ label: r, value: r })));
                await i.update({ content: "?? Que donnes-tu ?", components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)] });
            }
            if (i.customId.startsWith("accept_trade_")) {
                const parts = i.customId.split("_");
                const p1Id = parts[2], resGive = parts[3], resGet = parts[4];
                if (i.user.id === p1Id) return i.reply({ content: "Pas ton propre échange.", ephemeral: true });
                if (currentGame.executeTrade(p1Id, i.user.id, { [resGive as ResourceType]: 1 }, { [resGet as ResourceType]: 1 })) {
                    await i.update({ content: "? Échange accepté !", components: [] }); await updateBoard(null, `<@${i.user.id}> a accepté l\u0027Échange de <@${p1Id}>.`);
                } else await i.reply({ content: "Ressources insuffisantes.", ephemeral: true });
            }
            if (i.customId === "discard_btn") {
                const p = currentGame.players.find(p => p.id === i.user.id)!;
                const s = new StringSelectMenuBuilder().setCustomId("discard_select").setMinValues(1).setMaxValues(5);
                Object.entries(p.resources).forEach(([res, qty]) => { if (qty > 0) s.addOptions({ label: `${res} (${qty})`, value: res }); });
                await i.reply({ content: "Choisis les cartes à jeter :", components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)], ephemeral: true });
            }
            if (["build_settlement", "build_road", "build_city", "setup_settlement", "setup_road"].includes(i.customId)) {
                let spots: any[] = [], type = i.customId.includes("settlement") ? "settlement" : (i.customId.includes("road") ? "road" : "city");
                if (type === "settlement") spots = currentGame.getPlaceableNodes(i.user.id);
                else if (type === "road") spots = currentGame.getPlaceableEdges(i.user.id);
                else spots = currentGame.getUpgradableSettlements(i.user.id);
                const fmt = spots.map((s, j) => ({ id: s.id, label: getLabel(j) }));
                pendingActions.set(i.user.id, { type, spots: fmt });
                const b = await MapRenderer.renderInteractiveMap(currentGame, fmt.slice(0, 25), type !== "road");
                const s = new StringSelectMenuBuilder().setCustomId("select_spot").addOptions(fmt.slice(0, 25).map(s => ({ label: `Pos ${s.label}`, value: s.id })));
                await i.reply({ content: "?? Choisis :", files: [new AttachmentBuilder(b, { name: "catan.png" })], components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)], ephemeral: true });
            }
            if (i.customId === "move_robber_btn") {
                const spots = currentGame.map.filter(h => !h.hasRobber).map((h, j) => ({ id: h.id, label: getLabel(j) }));
                pendingActions.set(i.user.id, { type: "robber_move", spots });
                const s = new StringSelectMenuBuilder().setCustomId("select_spot").addOptions(spots.slice(0, 25).map(s => ({ label: `Hex ${s.label}`, value: s.id })));
                await i.reply({ content: "?? Déplacer :", components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)], ephemeral: true });
            }
            if (i.customId === "end_turn") { currentGame.nextTurn(); await i.deferUpdate(); await updateBoard(i, `<@${i.user.id}> a fini.`); }
        }
        if (i.isStringSelectMenu()) {
            if (i.customId === "trade_bank_give") {
                const s = new StringSelectMenuBuilder().setCustomId(`trade_bank_get_${i.values[0]}`).addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT && r !== i.values[0]).map(r => ({ label: r, value: r })));
                await i.update({ content: "Contre quoi ?", components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)] });
            }
            if (i.customId.startsWith("trade_bank_get_")) {
                const give = i.customId.split("_")[3] as ResourceType, get = i.values[0] as ResourceType;
                if (currentGame!.tradeWithBank(i.user.id, give, get)) { await i.update({ content: "? Fait", components: [] }); await updateBoard(); }
                else await i.update({ content: "? Impossible", components: [] });
            }
            if (i.customId === "trade_p_give") {
                const s = new StringSelectMenuBuilder().setCustomId(`trade_p_get_${i.values[0]}`).addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT && r !== i.values[0]).map(r => ({ label: r, value: r })));
                await i.update({ content: "Contre quoi ?", components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)] });
            }
            if (i.customId.startsWith("trade_p_get_")) {
                const give = i.customId.split("_")[3], get = i.values[0];
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(`accept_trade_${i.user.id}_${give}_${get}`).setLabel("Accepter").setStyle(ButtonStyle.Success));
                if (CHANNELS.COMMERCE) {
                    const c = client.channels.cache.get(CHANNELS.COMMERCE) as TextChannel;
                    await c.send({ content: `?? **ÉCHANGE** : <@${i.user.id}> donne **1 ${give}** contre **1 ${get}**.`, components: [row] });
                }
                await i.update({ content: "Offre envoyée !", components: [] });
            }
            if (i.customId === "select_spot") {
                const a = pendingActions.get(i.user.id); if (!a) return;
                let ok = false;
                if (a.type === "settlement") ok = currentGame!.buildSettlement(i.user.id, i.values[0]);
                else if (a.type === "city") ok = currentGame!.buildCity(i.user.id, i.values[0]);
                else if (a.type === "road") ok = currentGame!.buildRoad(i.user.id, i.values[0]);
                else if (a.type === "robber_move") {
                    const res = currentGame!.moveRobber(i.values[0], i.user.id);
                    if (res.success && res.victims.length > 0) {
                        const s = new StringSelectMenuBuilder().setCustomId("steal_select").addOptions(res.victims.map(v => ({ label: currentGame!.players.find(pl => pl.id === v)!.username, value: v })));
                        await i.update({ content: "?? Voler qui ?", components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)] }); return;
                    }
                    ok = res.success;
                }
                if (ok) { await i.update({ content: "? OK", components: [], files: [] }); await updateBoard(); }
                pendingActions.delete(i.user.id);
            }
            if (i.customId === "steal_select") {
                const stolen = currentGame!.stealCard(i.user.id, i.values[0]);
                await i.update({ content: `??? Volé : **${stolen}**`, components: [] }); await updateBoard();
            }
            if (i.customId === "discard_select") {
                const res: any = {}; i.values.forEach(v => res[v] = 1);
                if (currentGame!.discard(i.user.id, res)) await i.update({ content: "? Défaussé", components: [] });
                else await i.update({ content: "? Erreur", components: [] });
            }
        }
    } catch (e) {}
});
client.login(process.env.DISCORD_TOKEN);


import {
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    AttachmentBuilder, StringSelectMenuBuilder, TextChannel, Message,
    EmbedBuilder, MessageFlags
} from 'discord.js';
import { config } from 'dotenv';
import { CatanEngine } from './CatanEngine.js';
import { MapRenderer } from './MapRenderer.js';
import { GamePhase, ResourceType, DevCardType } from './core/types.js';
import { rulesCommand } from './discord/commands/rules.js';

config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let currentGame: CatanEngine | null = null;
let lobbyPlayers: any[] = [];
let pendingActions = new Map<string, any>();
let boardMessage: Message | null = null;
let plateauMessage: Message | null = null;
let TurnDMMessage: Message | null = null;
let pendingTradeOffers: Message[] = [];

const CHANNELS = {
    PLATEAU: process.env.CHANNEL_PLATEAU,
    JOURNAL: process.env.CHANNEL_JOURNAL,
    COMMERCE: process.env.CHANNEL_COMMERCE
};

const RESOURCE_EMOJI: Record<ResourceType, string> = {
    [ResourceType.WOOD]: '🌲',
    [ResourceType.BRICK]: '🧱',
    [ResourceType.SHEEP]: '🐑',
    [ResourceType.WHEAT]: '🌾',
    [ResourceType.ORE]: '⛰️',
    [ResourceType.DESERT]: '🌵',
};

function getLabel(i: number): string {
    let l = '';
    while (i >= 0) {
        l = String.fromCharCode(65 + (i % 26)) + l;
        i = Math.floor(i / 26) - 1;
    }
    return l;
}

async function guardCurrentPlayer(interaction: any): Promise<boolean> {
    if (!currentGame) return true;
    if (!currentGame.players.some(p => p.id === interaction.user.id)) {
        await interaction.reply({
            embeds: [new EmbedBuilder().setTitle('❌ Tu ne fais pas partie de cette partie.').setColor(0xE74C3C)],
            flags: MessageFlags.Ephemeral
        });
        return false;
    }
    if (currentGame.currentPlayer.id !== interaction.user.id) {
        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setTitle('❌ Ce n\'est pas ton tour !')
                .setDescription(`C'est actuellement au tour de **${currentGame.currentPlayer.username}** de jouer.\nAttends ton tour avant d'agir.`)
                .setColor(0xE74C3C)
            ],
            flags: MessageFlags.Ephemeral
        });
        return false;
    }
    return true;
}

async function guardInGame(interaction: any): Promise<boolean> {
    if (!currentGame) return true;
    if (!currentGame.players.some(p => p.id === interaction.user.id)) {
        await interaction.reply({
            embeds: [new EmbedBuilder().setTitle('❌ Tu ne fais pas partie de cette partie.').setColor(0xE74C3C)],
            flags: MessageFlags.Ephemeral
        });
        return false;
    }
    return true;
}

function formatResources(res: Record<ResourceType, number>): string {
    const total = res[ResourceType.WOOD] + res[ResourceType.BRICK] + res[ResourceType.SHEEP] + res[ResourceType.WHEAT] + res[ResourceType.ORE];
    return `🌲 **${res[ResourceType.WOOD]}** | 🧱 **${res[ResourceType.BRICK]}** | 🐑 **${res[ResourceType.SHEEP]}** | 🌾 **${res[ResourceType.WHEAT]}** | ⛰️ **${res[ResourceType.ORE]}**   *(total : ${total})*`;
}

function buildTurnEmbed(game: CatanEngine, playerId: string): EmbedBuilder {
    const player = game.players.find(p => p.id === playerId)!;
    const res = player.resources;
    const total = res[ResourceType.WOOD] + res[ResourceType.BRICK] + res[ResourceType.SHEEP] + res[ResourceType.WHEAT] + res[ResourceType.ORE];

    let title: string, description: string, color: number;

    switch (game.state) {
        case GamePhase.SETUP_1:
        case GamePhase.SETUP_2: {
            const round = game.state === GamePhase.SETUP_1 ? 'Tour 1 / 2' : 'Tour 2 / 2';
            title = `🏝️ Phase de Mise en Place — ${round}`;
            if (game.setupStep === 'SETTLEMENT') {
                description = [
                    '**Pose une colonie** en cliquant sur le bouton ci-dessous.',
                    '',
                    '📏 **Règle de distance** : ta colonie doit être séparée de toute autre par au moins 2 intersections.',
                    game.state === GamePhase.SETUP_2
                        ? '\n💡 *Ce tour-ci tu recevras automatiquement les ressources des 3 cases autour de ta colonie.*'
                        : ''
                ].join('\n');
            } else {
                description = [
                    '**Pose une route** adjacente à la colonie que tu viens de placer.',
                    '',
                    '➡️ Choisis une arête disponible sur la carte.'
                ].join('\n');
            }
            color = 0x2ECC71;
            break;
        }
        case GamePhase.PLAYING: {
            if (!game.hasRolled) {
                title = '🎲 Lance les dés !';
                description = [
                    'Lance les dés pour distribuer les ressources à **tous** les joueurs.',
                    '',
                    '**Rappel des coûts :**',
                    '🏠 Colonie (+1 PV) → 🌲+🧱+🐑+🌾',
                    '🛣️ Route → 🌲+🧱',
                    '🏙️ Ville (+1 PV) → ⛰️⛰️⛰️+🌾🌾',
                    '',
                    '⚠️ Un résultat de **7** déclenche le voleur !'
                ].join('\n');
                color = 0x3498DB;
            } else {
                title = '🎯 À toi d\'agir !';
                description = [
                    'Les dés ont été lancés. Tu peux maintenant :',
                    '',
                    '🏠 **Colonie** (+1 PV) → 🌲+🧱+🐑+🌾',
                    '🛣️ **Route** → 🌲+🧱',
                    '🏙️ **Ville** (+1 PV, remplace une colonie) → ⛰️⛰️⛰️+🌾🌾',
                    '🤝 **Échange** avec la banque (4:1 par défaut) ou un joueur',
                    '⭐ **Fin de tour** si tu n\'as rien à faire'
                ].join('\n');
                color = 0xE67E22;
            }
            break;
        }
        case GamePhase.ROAD_BUILDING: {
            title = '🛣️ Construction de Routes Gratuite !';
            description = `Tu as joué une carte Construction de Routes.\nPose **${game.roadBuildingRoadsLeft} route${game.roadBuildingRoadsLeft > 1 ? 's' : ''} gratuitement**.\n\n➡️ Clique sur le bouton pour choisir les emplacements.`;
            color = 0x27AE60;
            break;
        }
        case GamePhase.ROBBER_MOVE: {
            title = '😈 Déplace le Voleur !';
            description = [
                'Tu as fait un **7** (ou joué un Chevalier).',
                '',
                '**Déplace le voleur** sur une nouvelle case :',
                '• La case bloquée ne produira **plus de ressources** tant que le voleur y est.',
                '• Tu pourras voler **1 ressource** à un adversaire adjacent (s\'il en a).'
            ].join('\n');
            color = 0xE74C3C;
            break;
        }
        case GamePhase.DISCARDING: {
            const toDiscard = Math.floor(total / 2);
            title = '🗑️ Défausse Obligatoire !';
            description = [
                `Tu as **${total} ressources** (maximum autorisé : 7).`,
                `Tu dois en défausser **${toDiscard}** *(la moitié, arrondie à l\'inférieur)*.`,
                '',
                '➡️ Clique sur **Défausse** et sélectionne les ressources à retirer.'
            ].join('\n');
            color = 0xC0392B;
            break;
        }
        case GamePhase.ROBBER_STEAL: {
            title = '🕵️ Vol — Qui vas-tu voler ?';
            description = 'Choisis un joueur parmi ceux qui ont un bâtiment sur la case du voleur.\n\nTu lui voleras **1 ressource aléatoire**.';
            color = 0x8E44AD;
            break;
        }
        default:
            title = '🎮 Les Colons de Catane';
            description = 'En attente...';
            color = 0xE8A838;
    }

    const scoreBoard = game.players
        .sort((a, b) => b.victoryPoints - a.victoryPoints)
        .map(pl => {
            const isCurrent = pl.id === playerId;
            const extras = [
                pl.hasLargestArmy ? '⚔️' : '',
                pl.hasLongestRoad ? '🛣️' : ''
            ].filter(Boolean).join('');
            const vp = pl.id === playerId ? game.getEffectiveVP(pl.id) : pl.victoryPoints;
            const hiddenVP = pl.id === playerId ? pl.devCards.filter(c => c === DevCardType.VICTORY_POINT).length : 0;
            const vpSuffix = hiddenVP > 0 ? ` *(+${hiddenVP} cachés)*` : '';
            return `${isCurrent ? '▶ ' : ''}**${pl.username}** — ${vp} PV ${extras}${vpSuffix}`;
        })
        .join('\n');

    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .addFields(
            { name: '🎒 Tes Ressources', value: formatResources(res), inline: false },
            { name: '🏆 Classement', value: scoreBoard, inline: false }
        )
        .setColor(color)
        .setFooter({ text: '/cards → tes ressources  •  /rules → les règles complètes' });
}

function buildRulesCard(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('📋 Guide de Jeu — Les Colons de Catane')
        .setColor(0xE8A838)
        .setDescription('Bienvenue ! Voici tout ce dont tu as besoin pour jouer. Tu peux relire ce guide à tout moment avec `/rules`.')
        .addFields(
            {
                name: '🎯 Objectif',
                value: 'Être le premier à atteindre **10 Points de Victoire (PV)**.'
            },
            {
                name: '🔄 Déroulement d\'un tour',
                value: '1️⃣ **Lancer les dés** → tous les joueurs reçoivent les ressources des cases dont le numéro correspond\n2️⃣ **Construire / Commercer** (optionnel)\n3️⃣ **Passer son tour**'
            },
            {
                name: '🏗️ Coûts de Construction',
                value: '🏠 **Colonie** (1 PV) → 🌲 Bois + 🧱 Argile + 🐑 Mouton + 🌾 Blé\n🛣️ **Route** → 🌲 Bois + 🧱 Argile\n🏙️ **Ville** (2 PV, remplace une colonie) → ⛰️⛰️⛰️ Minerai + 🌾🌾 Blé\n🃏 **Carte Dev** → ⛰️ Minerai + 🐑 Mouton + 🌾 Blé'
            },
            {
                name: '😈 Le 7 — Le Voleur',
                value: '• Personne ne reçoit de ressources\n• Si tu as **plus de 7 ressources** → défausse la moitié (arrondie)\n• Tu déplaces le **Voleur** pour bloquer une case\n• Tu voles **1 ressource** à un joueur adjacent (s\'il en a)'
            },
            {
                name: '🏦 Commerce avec la Banque',
                value: '**4:1** par défaut • **3:1** avec un port générique • **2:1** avec un port spécialisé'
            },
            {
                name: '🏆 Bonus',
                value: '⚔️ **Armée la Plus Puissante** (3 chevaliers min.) → +2 PV\n🛣️ **Route la Plus Longue** (5 routes consécutives min.) → +2 PV'
            },
            {
                name: '🃏 Cartes de Développement',
                value: '⚔️ **Chevalier** → déplace le voleur + vol\n🎯 **Monopole** → prend toutes les ressources d\'un type\n🎁 **Abondance** → prends 2 ressources libres dans la banque\n🛣️ **Construction de Routes** → 2 routes gratuites\n⭐ **Point de Victoire** → +1 PV (révélé à la fin)'
            }
        )
        .setFooter({ text: 'Tu recevras un message à chaque fois que c\'est ton tour.' });
}

async function sendTurnDM(player: any, rows: ActionRowBuilder<ButtonBuilder>[], embed: EmbedBuilder): Promise<Message | null> {
    try {
        const user = await client.users.fetch(player.id);
        return await user.send({ embeds: [embed], components: rows });
    } catch {
        return null;
    }
}

async function sendWaitDM(player: any, currentPlayerName: string, game: CatanEngine): Promise<void> {
    try {
        const user = await client.users.fetch(player.id);
        const res = player.resources;
        const embed = new EmbedBuilder()
            .setTitle('⏳ En attente de ' + currentPlayerName)
            .setDescription('Ce n\'est pas encore ton tour. Tu seras notifié dès que c\'est à toi de jouer.')
            .addFields(
                { name: '🎒 Tes Ressources', value: formatResources(res), inline: false },
                { name: '⭐ Tes PV', value: String(player.victoryPoints), inline: true },
                { name: '🃏 Cartes Dev', value: String(player.devCards.length), inline: true }
            )
            .setColor(0x95A5A6)
            .setFooter({ text: '/cards → tes ressources  •  /rules → les règles' });
        await user.send({ embeds: [embed] });
    } catch {}
}

async function sendRulesDM(player: any, playerIndex: number, color: string): Promise<void> {
    try {
        const user = await client.users.fetch(player.id);
        const welcomeEmbed = new EmbedBuilder()
            .setTitle('🏝️ Bienvenue sur l\'île de Catane !')
            .setDescription(`Tu es le joueur **#${playerIndex + 1}** avec la couleur \`${color}\`.\n\nLa partie va commencer. Tu recevras un message à chaque fois que c'est ton tour.`)
            .setColor(color as any)
            .setFooter({ text: 'Bonne chance !' });
        await user.send({ embeds: [welcomeEmbed, buildRulesCard()] });
    } catch {}
}

async function clearTradeOffers(): Promise<void> {
    await Promise.all(pendingTradeOffers.map(async msg => {
        try { await msg.edit({ components: [] }); } catch {}
    }));
    pendingTradeOffers = [];
}

async function updateInterface(logMsg: string = ''): Promise<void> {
    if (!currentGame) return;
    if (currentGame.state !== GamePhase.DISCARDING) await clearTradeOffers();
    try {
        const buffer = await MapRenderer.renderMapToBuffer(currentGame);
        const attachment = new AttachmentBuilder(buffer, { name: 'catan.png' });
        const p = currentGame.currentPlayer;

        if (CHANNELS.PLATEAU) {
            const pc = client.channels.cache.get(CHANNELS.PLATEAU) as TextChannel;
            if (pc) {
                const content = '🗺️ **Plateau de Jeu** | Tour de <@' + p.id + '>';
                if (plateauMessage) {
                    try {
                        await plateauMessage.edit({ content, files: [attachment] });
                    } catch {
                        plateauMessage = await pc.send({ content, files: [attachment] });
                    }
                } else {
                    plateauMessage = await pc.send({ content, files: [attachment] });
                }
            }
        }

        if (logMsg && CHANNELS.JOURNAL) {
            const jc = client.channels.cache.get(CHANNELS.JOURNAL) as TextChannel;
            if (jc) await jc.send('📖 ' + logMsg);
        }

        const rows: ActionRowBuilder<ButtonBuilder>[] = [];

        if (currentGame.state === GamePhase.PLAYING) {
            if (!currentGame.hasRolled) {
                const row1 = new ActionRowBuilder<ButtonBuilder>();
                row1.addComponents(
                    new ButtonBuilder().setCustomId('roll_dice').setLabel('🎲 Lancer les Dés').setStyle(ButtonStyle.Primary)
                );
                const playable = currentGame.getPlayableDevCards(currentGame.currentPlayer.id);
                if (playable.length > 0) {
                    row1.addComponents(
                        new ButtonBuilder().setCustomId('dev_card_btn').setLabel('🃏 Jouer une Carte Dev').setStyle(ButtonStyle.Secondary)
                    );
                }
                rows.push(row1);
            } else {
                const row1 = new ActionRowBuilder<ButtonBuilder>();
                row1.addComponents(
                    new ButtonBuilder().setCustomId('build_settlement').setLabel('🏠 Colonie').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('build_road').setLabel('🛣️ Route').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('build_city').setLabel('🏙️ Ville').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('buy_dev_btn').setLabel('🃏 Acheter Dev').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('end_turn').setLabel('⭐ Fin du tour').setStyle(ButtonStyle.Secondary)
                );
                rows.push(row1);
                const row2 = new ActionRowBuilder<ButtonBuilder>();
                row2.addComponents(
                    new ButtonBuilder().setCustomId('trade_btn').setLabel('🤝 Échange').setStyle(ButtonStyle.Secondary)
                );
                const playable = currentGame.getPlayableDevCards(currentGame.currentPlayer.id);
                if (playable.length > 0 && !currentGame.hasPlayedDevCard) {
                    row2.addComponents(
                        new ButtonBuilder().setCustomId('dev_card_btn').setLabel('🃏 Jouer Carte Dev').setStyle(ButtonStyle.Secondary)
                    );
                }
                rows.push(row2);
            }
        } else if (currentGame.state === GamePhase.ROAD_BUILDING) {
            const row1 = new ActionRowBuilder<ButtonBuilder>();
            row1.addComponents(
                new ButtonBuilder().setCustomId('build_road').setLabel(`🛣️ Poser Route Gratuite (${currentGame.roadBuildingRoadsLeft} restante(s))`).setStyle(ButtonStyle.Primary)
            );
            rows.push(row1);
        } else if (currentGame.state === GamePhase.ROBBER_MOVE) {
            const row1 = new ActionRowBuilder<ButtonBuilder>();
            row1.addComponents(
                new ButtonBuilder().setCustomId('move_robber_btn').setLabel('😈 Déplacer le Voleur').setStyle(ButtonStyle.Danger)
            );
            rows.push(row1);
        } else if (currentGame.state === GamePhase.DISCARDING) {
            const row1 = new ActionRowBuilder<ButtonBuilder>();
            row1.addComponents(
                new ButtonBuilder().setCustomId('discard_btn').setLabel('🗑️ Défausser des Ressources').setStyle(ButtonStyle.Danger)
            );
            rows.push(row1);
        } else if (currentGame.state !== GamePhase.FINISHED) {
            const row1 = new ActionRowBuilder<ButtonBuilder>();
            if (currentGame.setupStep === 'SETTLEMENT') {
                row1.addComponents(
                    new ButtonBuilder().setCustomId('setup_settlement').setLabel('🏠 Poser une Colonie').setStyle(ButtonStyle.Success)
                );
            } else {
                row1.addComponents(
                    new ButtonBuilder().setCustomId('setup_road').setLabel('🛣️ Poser une Route').setStyle(ButtonStyle.Success)
                );
            }
            rows.push(row1);
        }

        if (currentGame.state === GamePhase.DISCARDING) {
            const toDiscardPlayers = currentGame.players.filter(
                pl => currentGame!.getPlayerResourceCount(pl.id) > 7 && !currentGame!.discardedPlayers.has(pl.id)
            );
            await Promise.all(toDiscardPlayers.map(pl => sendTurnDM(pl, rows, buildTurnEmbed(currentGame!, pl.id))));
            const waitingPlayers = currentGame.players.filter(
                pl => !toDiscardPlayers.some(d => d.id === pl.id)
            );
            await Promise.all(waitingPlayers.map(pl => sendWaitDM(pl, 'tous (défausse en cours)', currentGame!)));
        } else {
            TurnDMMessage = await sendTurnDM(currentGame.currentPlayer, rows, buildTurnEmbed(currentGame, currentGame.currentPlayer.id));
            await Promise.all(
                currentGame.players
                    .filter(pl => pl.id !== currentGame!.currentPlayer.id)
                    .map(pl => sendWaitDM(pl, currentGame!.currentPlayer.username, currentGame!))
            );
        }

        const msg = currentGame.state === GamePhase.FINISHED ? '🏆 Fin de partie !' : '🎮 Tour de <@' + p.id + '>';

        if (CHANNELS.COMMERCE) {
            const c = client.channels.cache.get(CHANNELS.COMMERCE) as TextChannel;
            if (c) {
                if (boardMessage) {
                    try {
                        await boardMessage.edit({ content: msg, components: rows });
                    } catch {
                        boardMessage = await c.send({ content: msg, components: rows });
                    }
                } else {
                    boardMessage = await c.send({ content: msg, components: rows });
                }
            }
        }

        const winner = currentGame.checkWinner();
        if (winner) {
            currentGame.state = GamePhase.FINISHED;
            const winnerEffectiveVP = currentGame.getEffectiveVP(winner.id);
            if (CHANNELS.JOURNAL) {
                const c = client.channels.cache.get(CHANNELS.JOURNAL) as TextChannel;
                if (c) await c.send('🏆 **VICTOIRE** : <@' + winner.id + '> a gagné avec **' + winnerEffectiveVP + ' PV** !');
            }
            await Promise.all(currentGame.players.map(async pl => {
                try {
                    const user = await client.users.fetch(pl.id);
                    const isWinner = pl.id === winner.id;
                    const vpCards = winner.devCards.filter(c => c === DevCardType.VICTORY_POINT).length;
                    const vpReveal = vpCards > 0 ? `\n🃏 **Cartes Point de Victoire révélées : ${vpCards}** (cachées jusqu\'à la victoire)` : '';
                    const endEmbed = new EmbedBuilder()
                        .setTitle(isWinner ? '🏆 Tu as gagné !' : '🎮 Fin de partie !')
                        .setDescription(isWinner
                            ? `Félicitations ! Tu as atteint **${winnerEffectiveVP} PV** et remporté la partie !${vpReveal}`
                            : `**${winner.username}** a remporté la partie avec **${winnerEffectiveVP} PV**.${vpReveal}\nTu as terminé avec **${currentGame!.getEffectiveVP(pl.id)} PV**.`)
                        .addFields({
                            name: '📊 Classement final',
                            value: currentGame!.players
                                .sort((a, b) => currentGame!.getEffectiveVP(b.id) - currentGame!.getEffectiveVP(a.id))
                                .map((p, idx) => {
                                    const ep = currentGame!.getEffectiveVP(p.id);
                                    const vpC = p.devCards.filter(c => c === DevCardType.VICTORY_POINT).length;
                                    return `${idx + 1}. **${p.username}** — ${ep} PV${vpC > 0 ? ` *(dont ${vpC} cartes PV)*` : ''}`;
                                })
                                .join('\n')
                        })
                        .setColor(isWinner ? 0xF1C40F : 0x95A5A6);
                    await user.send({ embeds: [endEmbed] });
                } catch {}
            }));
        }
    } catch (e) {
        console.error(e);
    }
}

client.on('interactionCreate', async (i) => {
    try {
        if (i.isChatInputCommand()) {
            if (i.commandName === 'start') {
                lobbyPlayers = [{ id: i.user.id, username: i.user.username, color: '#E74C3C' }];
                const embed = new EmbedBuilder()
                    .setTitle('🏝️ Île de Catane — Lobby ouvert !')
                    .setDescription(`**${i.user.username}** a créé une partie.\n\nUtilise \`/join\` pour rejoindre et \`/begin\` quand vous êtes prêts (2 à 4 joueurs).`)
                    .addFields({ name: '👥 Joueurs (1/4)', value: `• ${i.user.username}` })
                    .setColor('#E74C3C');
                await i.reply({ embeds: [embed] });
            }

            if (i.commandName === 'join') {
                if (lobbyPlayers.length >= 4) return i.reply({ content: '❌ Le lobby est complet (4/4).', flags: MessageFlags.Ephemeral });
                if (lobbyPlayers.find((p: any) => p.id === i.user.id)) return i.reply({ content: '❌ Tu es déjà dans le lobby.', flags: MessageFlags.Ephemeral });
                const colors = ['#3498DB', '#FFFFFF', '#E67E22'];
                lobbyPlayers.push({ id: i.user.id, username: i.user.username, color: colors[lobbyPlayers.length - 1] });
                const embed = new EmbedBuilder()
                    .setTitle('🏰 Nouveau Colon !')
                    .setDescription(`**${i.user.username}** a rejoint l'île de Catane !`)
                    .addFields({
                        name: `👥 Joueurs (${lobbyPlayers.length}/4)`,
                        value: lobbyPlayers.map((p, idx) => `${idx + 1}. ${p.username}`).join('\n')
                    })
                    .setThumbnail(i.user.displayAvatarURL())
                    .setColor(lobbyPlayers[lobbyPlayers.length - 1].color as any)
                    .setFooter({ text: lobbyPlayers.length >= 2 ? 'Tapez /begin pour lancer la partie !' : 'En attente d\'autres joueurs...' });
                await i.reply({ embeds: [embed] });
            }

            if (i.commandName === 'begin') {
                if (lobbyPlayers.length < 2) return i.reply({ content: '❌ Il faut au moins 2 joueurs pour commencer.', flags: MessageFlags.Ephemeral });
                currentGame = new CatanEngine(lobbyPlayers);
                boardMessage = null;
                plateauMessage = null;
                const embed = new EmbedBuilder()
                    .setTitle('⚔️ La partie commence !')
                    .setDescription('Le plateau a été généré. Chaque joueur va recevoir un guide de jeu en message privé.\n\n**Phase de mise en place** : chaque joueur pose 2 colonies et 2 routes, dans l\'ordre puis en sens inverse.')
                    .addFields({
                        name: '👥 Joueurs',
                        value: lobbyPlayers.map((p, idx) => `${idx + 1}. **${p.username}**`).join('\n')
                    })
                    .setColor('#E67E22');
                await i.reply({ embeds: [embed] });
                await Promise.all(lobbyPlayers.map((p, idx) => sendRulesDM(p, idx, p.color)));
                await updateInterface('La partie a commencé !');
            }

            if (i.commandName === 'cards') {
                if (!currentGame) return i.reply({ content: '❌ Aucune partie en cours.', flags: MessageFlags.Ephemeral });
                const p = currentGame.players.find(p => p.id === i.user.id);
                if (!p) return i.reply({ content: '❌ Tu ne fais pas partie de cette partie.', flags: MessageFlags.Ephemeral });
                const devCardDisplay: Record<DevCardType, string> = {
                    [DevCardType.KNIGHT]: '⚔️ Chevalier',
                    [DevCardType.ROAD_BUILDING]: '🛣️ Construction de Routes',
                    [DevCardType.YEAR_OF_PLENTY]: '🎁 Abondance',
                    [DevCardType.MONOPOLY]: '🎯 Monopole',
                    [DevCardType.VICTORY_POINT]: '⭐ Point de Victoire',
                };
                const devCounts: Partial<Record<DevCardType, number>> = {};
                p.devCards.forEach(c => { devCounts[c] = (devCounts[c] ?? 0) + 1; });
                const devStr = Object.entries(devCounts)
                    .map(([t, q]) => `${devCardDisplay[t as DevCardType]} ×${q}`)
                    .join('\n') || 'Aucune';
                const effectiveVP = currentGame.getEffectiveVP(p.id);
                const embed = new EmbedBuilder()
                    .setTitle('🎒 Tes Ressources & Cartes')
                    .setDescription(formatResources(p.resources))
                    .addFields(
                        { name: '⭐ Points de Victoire', value: String(effectiveVP), inline: true },
                        { name: '🛣️ Routes posées', value: String(15 - p.stock.roads), inline: true },
                        { name: '🏠 Colonies restantes', value: String(p.stock.settlements), inline: true },
                        { name: '🃏 Cartes de Développement', value: devStr, inline: false }
                    )
                    .setColor(p.color as any)
                    .setFooter({ text: 'Visible uniquement par toi.' });
                await i.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
            }

            if (i.commandName === 'rules') {
                await rulesCommand.execute(i);
            }
        }

        if (i.isButton()) {
            if (!currentGame) return;

            if (i.customId === 'roll_dice') {
                if (!await guardCurrentPlayer(i)) return;
                const result = currentGame.rollDice();
                if (result) {
                    await i.deferUpdate();
                    await i.editReply({ components: [] });
                    let logMsg = `<@${i.user.id}> a lancé les dés : **${result.total}**`;
                    if (result.isRobber) {
                        logMsg += ' — 😈 **Le Voleur !** Aucune ressource distribuée.';
                        if (result.toDiscard.length > 0) {
                            logMsg += ` ${result.toDiscard.map(id => `<@${id}>`).join(', ')} doivent défausser.`;
                        }
                    } else {
                        const gains = Object.entries(result.harvests);
                        if (gains.length > 0) {
                            const gainStr = gains.map(([name, r]) =>
                                `**${name}** reçoit ${Object.entries(r).map(([res, qty]) => `${qty}× ${RESOURCE_EMOJI[res as ResourceType] ?? res}`).join(', ')}`
                            ).join(' | ');
                            logMsg += ` — ${gainStr}`;
                        } else {
                            logMsg += ' — Aucune ressource distribuée ce tour.';
                        }
                    }
                    await updateInterface(logMsg);
                }
            }

            if (i.customId === 'buy_dev_btn') {
                if (!await guardCurrentPlayer(i)) return;
                if (!currentGame.hasRolled) {
                    return i.reply({
                        embeds: [new EmbedBuilder().setTitle('❌ Lance les dés d\'abord !').setDescription('Tu dois lancer les dés avant d\'acheter une carte de développement.').setColor(0xE74C3C)],
                        flags: MessageFlags.Ephemeral
                    });
                }
                const card = currentGame.buyDevCard(i.user.id);
                if (card === null) {
                    return i.reply({
                        embeds: [new EmbedBuilder().setTitle('❌ Impossible d\'acheter').setDescription('Ressources insuffisantes (⛰️+🐑+🌾) ou pioche vide.').setColor(0xE74C3C)],
                        flags: MessageFlags.Ephemeral
                    });
                }
                await i.reply({
                    embeds: [new EmbedBuilder().setTitle('🃏 Carte achetée !').setDescription('Elle sera révélée à la fin si c\'est un Point de Victoire.').setColor(0x27AE60)],
                    flags: MessageFlags.Ephemeral
                });
                await updateInterface(`<@${i.user.id}> a acheté une carte de développement.`);
            }

            if (i.customId === 'dev_card_btn') {
                if (!await guardCurrentPlayer(i)) return;
                const playableCards = currentGame.getPlayableDevCards(i.user.id);
                if (playableCards.length === 0) {
                    return i.reply({
                        embeds: [new EmbedBuilder().setTitle('❌ Aucune carte jouable').setDescription('Aucune carte jouable ce tour (déjà jouée ou achetée ce tour).').setColor(0xE74C3C)],
                        flags: MessageFlags.Ephemeral
                    });
                }
                const devCardLabels: Record<string, string> = {
                    [DevCardType.KNIGHT]: '⚔️ Chevalier — Déplace le voleur + vol',
                    [DevCardType.ROAD_BUILDING]: '🛣️ Construction de Routes — 2 routes gratuites',
                    [DevCardType.YEAR_OF_PLENTY]: '🎁 Abondance — Prends 2 ressources de ton choix',
                    [DevCardType.MONOPOLY]: '🎯 Monopole — Prends toutes les ressources d\'un type'
                };
                const s = new StringSelectMenuBuilder()
                    .setCustomId('dev_card_select')
                    .setPlaceholder('Choisis une carte à jouer')
                    .addOptions(playableCards.map(t => ({ label: devCardLabels[t] ?? t, value: t })));
                await i.reply({
                    embeds: [new EmbedBuilder().setTitle('🃏 Jouer une Carte de Développement').setColor(0x9B59B6)],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (i.customId === 'trade_btn') {
                if (!await guardCurrentPlayer(i)) return;
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder().setCustomId('trade_bank_init').setLabel('🏦 Banque (4:1 par défaut)').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('trade_player_init').setLabel('👥 Proposer à un joueur').setStyle(ButtonStyle.Primary)
                );
                await i.reply({
                    embeds: [new EmbedBuilder().setTitle('🤝 Type d\'Échange').setDescription('**Banque** : donne 4 ressources identiques, reçois 1 au choix.\n**Joueur** : propose 1 ressource contre 1 autre à tous les joueurs.').setColor(0x3498DB)],
                    components: [row],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (i.customId === 'trade_bank_init') {
                if (!await guardCurrentPlayer(i)) return;
                const s = new StringSelectMenuBuilder().setCustomId('trade_bank_give')
                    .setPlaceholder('Quelle ressource veux-tu donner ?')
                    .addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT).map(r => ({ label: RESOURCE_EMOJI[r] + ' ' + r, value: r })));
                await i.update({
                    embeds: [new EmbedBuilder().setTitle('🏦 Échange Banque — Étape 1/2').setDescription('Sélectionne la ressource que tu veux **donner** à la banque.').setColor(0x95A5A6)],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)]
                });
            }

            if (i.customId === 'trade_player_init') {
                if (!await guardCurrentPlayer(i)) return;
                const p = currentGame.players.find(pl => pl.id === i.user.id)!;
                const offerOptions: { label: string, value: string }[] = [];
                Object.entries(p.resources).forEach(([res, qty]) => {
                    if (res === ResourceType.DESERT || qty <= 0) return;
                    for (let n = 1; n <= qty; n++) {
                        offerOptions.push({ label: `${RESOURCE_EMOJI[res as ResourceType]} ${res} n°${n}`, value: `${res}_${n}` });
                    }
                });
                if (offerOptions.length === 0) {
                    return i.update({
                        embeds: [new EmbedBuilder().setTitle('❌ Aucune ressource à proposer').setColor(0xE74C3C)],
                        components: []
                    });
                }
                const s = new StringSelectMenuBuilder()
                    .setCustomId('trade_p_offer')
                    .setPlaceholder('Ressources que tu proposes (sélectionne 1 à 5)')
                    .setMinValues(1)
                    .setMaxValues(Math.min(5, offerOptions.length))
                    .addOptions(offerOptions.slice(0, 25));
                await i.update({
                    embeds: [new EmbedBuilder().setTitle('👥 Échange — Ce que tu proposes').setDescription('Sélectionne les ressources que tu veux **donner**.').setColor(0x3498DB)],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)]
                });
            }

            if (i.customId.startsWith('accept_trade_')) {
                if (!await guardInGame(i)) return;
                const [, , p1Id, ...rest] = i.customId.split('_');
                const splitIdx = rest.indexOf('FOR');
                const giveKeys = rest.slice(0, splitIdx);
                const getKeys = rest.slice(splitIdx + 1);
                if (i.user.id === p1Id) return i.reply({ content: '❌ Tu ne peux pas accepter ton propre échange.', flags: MessageFlags.Ephemeral });
                const giveMap: Partial<Record<ResourceType, number>> = {};
                giveKeys.forEach(k => { const t = k.split('.')[0] as ResourceType; giveMap[t] = (giveMap[t] ?? 0) + 1; });
                const getMap: Partial<Record<ResourceType, number>> = {};
                getKeys.forEach(k => { const t = k.split('.')[0] as ResourceType; getMap[t] = (getMap[t] ?? 0) + 1; });
                if (currentGame.executeTrade(p1Id, i.user.id, giveMap, getMap)) {
                    await i.update({ content: '✅ Échange accepté !', components: [] });
                    const giveStr = Object.entries(giveMap).map(([r, q]) => `${q}× ${RESOURCE_EMOJI[r as ResourceType]}`).join(' ');
                    const getStr = Object.entries(getMap).map(([r, q]) => `${q}× ${RESOURCE_EMOJI[r as ResourceType]}`).join(' ');
                    await updateInterface(`<@${i.user.id}> a accepté l\'échange de <@${p1Id}> (${giveStr} ↔ ${getStr}).`);
                } else {
                    await i.reply({ content: '❌ Ressources insuffisantes pour effectuer cet échange.', flags: MessageFlags.Ephemeral });
                }
            }

            if (i.customId === 'discard_btn') {
                if (!await guardInGame(i)) return;
                if (currentGame.state !== GamePhase.DISCARDING) return i.reply({ content: '❌ Ce n\'est pas la phase de défausse.', flags: MessageFlags.Ephemeral });
                if (currentGame.getPlayerResourceCount(i.user.id) <= 7) return i.reply({ content: '❌ Tu n\'as pas à défausser (tu as 7 ressources ou moins).', flags: MessageFlags.Ephemeral });
                if (currentGame.discardedPlayers.has(i.user.id)) return i.reply({ content: '❌ Tu as déjà défaussé ce tour.', flags: MessageFlags.Ephemeral });
                const p = currentGame.players.find(pl => pl.id === i.user.id)!;
                const total = currentGame.getPlayerResourceCount(i.user.id);
                const toDiscard = Math.floor(total / 2);
                const options: { label: string, value: string }[] = [];
                Object.entries(p.resources).forEach(([res, qty]) => {
                    if (res === ResourceType.DESERT || qty <= 0) return;
                    for (let n = 1; n <= qty; n++) {
                        options.push({ label: `${RESOURCE_EMOJI[res as ResourceType]} ${res} n°${n}`, value: `${res}_${n}` });
                    }
                });
                const slicedOptions = options.slice(0, 25);
                if (slicedOptions.length === 0) return i.reply({ content: '❌ Aucune ressource à défausser.', flags: MessageFlags.Ephemeral });
                const effectiveDiscard = Math.min(toDiscard, slicedOptions.length);
                const s = new StringSelectMenuBuilder()
                    .setCustomId('discard_select')
                    .setPlaceholder(`Sélectionne exactement ${effectiveDiscard} ressource(s) à défausser`)
                    .setMinValues(effectiveDiscard)
                    .setMaxValues(effectiveDiscard)
                    .addOptions(slicedOptions);
                await i.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('🗑️ Défausse Obligatoire')
                        .setDescription(`Tu as **${total} ressources**. Tu dois en défausser **${toDiscard}**.`)
                        .setColor(0xC0392B)
                    ],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (['build_settlement', 'build_road', 'build_city', 'setup_settlement', 'setup_road'].includes(i.customId)) {
                if (!await guardCurrentPlayer(i)) return;
                const type = i.customId.includes('settlement') ? 'settlement' : (i.customId.includes('road') ? 'road' : 'city');
                let spots: any[] = [];
                if (type === 'settlement') spots = currentGame.getPlaceableNodes(i.user.id);
                else if (type === 'road') spots = currentGame.getPlaceableEdges(i.user.id);
                else spots = currentGame.getUpgradableSettlements(i.user.id);

                if (spots.length === 0) {
                    if (type === 'road' && currentGame.state === GamePhase.ROAD_BUILDING) {
                        currentGame.roadBuildingRoadsLeft = 0;
                        currentGame.state = GamePhase.PLAYING;
                        await i.deferUpdate();
                        await i.editReply({ components: [] });
                        await updateInterface(`<@${i.user.id}> n'a plus d'emplacement disponible — Construction de Routes terminée.`);
                        return;
                    }
                    const reasonMap: Record<string, string> = {
                        settlement: 'Aucun emplacement valide (vérifie la règle de distance et tes ressources).',
                        road: 'Aucune route possible (vérifie que tu es connecté et que tu as les ressources).',
                        city: 'Aucune colonie à améliorer (vérifie tes ressources).'
                    };
                    return i.reply({ content: `❌ ${reasonMap[type]}`, flags: MessageFlags.Ephemeral });
                }

                const fmt = spots.map((s, j) => ({ id: s.id, label: getLabel(j) })).slice(0, 25);
                pendingActions.set(i.user.id, { type, spots: fmt });
                const mapBuffer = await MapRenderer.renderInteractiveMap(currentGame, fmt, type !== 'road');
                const select = new StringSelectMenuBuilder()
                    .setCustomId('select_spot')
                    .setPlaceholder('Choisis un emplacement (A, B, C...)')
                    .addOptions(fmt.map(s => ({ label: 'Emplacement ' + s.label, value: s.id })));
                const labels: Record<string, string> = {
                    settlement: '🏠 Poser une Colonie',
                    road: '🛣️ Poser une Route',
                    city: '🏙️ Construire une Ville'
                };
                await i.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(labels[type] ?? '📍 Choix d\'emplacement')
                        .setDescription(`Sélectionne un emplacement dans la liste. Les positions disponibles sont marquées sur la carte (A, B, C...).`)
                        .setImage('attachment://catan.png')
                        .setColor(0x2ECC71)
                    ],
                    files: [new AttachmentBuilder(mapBuffer, { name: 'catan.png' })],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (i.customId === 'move_robber_btn') {
                if (!await guardCurrentPlayer(i)) return;
                const spots = currentGame.map.filter(h => !h.hasRobber).map((h, j) => ({ id: h.id, label: getLabel(j) }));
                pendingActions.set(i.user.id, { type: 'robber_move', spots });
                const s = new StringSelectMenuBuilder()
                    .setCustomId('select_spot')
                    .setPlaceholder('Choisis une case pour le voleur')
                    .addOptions(spots.slice(0, 25).map(s => ({ label: `Case ${s.label} — ${currentGame!.map.find(h => h.id === s.id)?.resource ?? ''}`, value: s.id })));
                await i.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle('😈 Déplacer le Voleur')
                        .setDescription('Sélectionne une case. Le voleur bloquera sa production et tu pourras voler une ressource à un joueur adjacent.')
                        .setColor(0xE74C3C)
                    ],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)],
                    flags: MessageFlags.Ephemeral
                });
            }

            if (TurnDMMessage) {
                try { await TurnDMMessage.edit({ components: [] }); } catch {}
                TurnDMMessage = null;
            }

            if (i.customId === 'end_turn') {
                if (!await guardCurrentPlayer(i)) return;
                await clearTradeOffers();
                currentGame.nextTurn();
                await i.deferUpdate();
                await i.editReply({ components: [] });
                await updateInterface(`<@${i.user.id}> a terminé son tour.`);
            }
        }

        if (i.isStringSelectMenu()) {
            if (i.customId === 'dev_card_select') {
                if (!await guardCurrentPlayer(i)) return;
                const type = i.values[0] as DevCardType;
                const userId = i.user.id;
                if (type === DevCardType.KNIGHT) {
                    currentGame!.playDevCard(userId, DevCardType.KNIGHT);
                    await i.update({
                        embeds: [new EmbedBuilder().setTitle('⚔️ Chevalier joué !').setDescription('Déplace le voleur pour voler une ressource.').setColor(0xE74C3C)],
                        components: []
                    });
                    await updateInterface(`<@${userId}> a joué un Chevalier !`);
                } else if (type === DevCardType.ROAD_BUILDING) {
                    currentGame!.playDevCard(userId, DevCardType.ROAD_BUILDING);
                    await i.update({
                        embeds: [new EmbedBuilder().setTitle('🛣️ Construction de Routes joué !').setDescription('Tu peux poser 2 routes gratuitement.').setColor(0x27AE60)],
                        components: []
                    });
                    await updateInterface(`<@${userId}> a joué Construction de Routes !`);
                } else if (type === DevCardType.MONOPOLY) {
                    const s = new StringSelectMenuBuilder()
                        .setCustomId('monopoly_select')
                        .setPlaceholder('Choisis une ressource à monopoliser')
                        .addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT).map(r => ({ label: RESOURCE_EMOJI[r] + ' ' + r, value: r })));
                    await i.update({
                        embeds: [new EmbedBuilder().setTitle('🎯 Monopole — Choisis une ressource').setDescription('Tu vas prendre toutes les ressources de ce type à tous les joueurs.').setColor(0xE67E22)],
                        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)]
                    });
                } else if (type === DevCardType.YEAR_OF_PLENTY) {
                    const s = new StringSelectMenuBuilder()
                        .setCustomId('yop_r1_select')
                        .setPlaceholder('Première ressource')
                        .addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT).map(r => ({ label: RESOURCE_EMOJI[r] + ' ' + r, value: r })));
                    await i.update({
                        embeds: [new EmbedBuilder().setTitle('🎁 Abondance — Choisis la 1ère ressource').setDescription('Choisis ta première ressource gratuite.').setColor(0x3498DB)],
                        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)]
                    });
                }
            }

            if (i.customId === 'monopoly_select') {
                if (!await guardCurrentPlayer(i)) return;
                const res = i.values[0] as ResourceType;
                currentGame!.playDevCard(i.user.id, DevCardType.MONOPOLY, res);
                await i.update({
                    embeds: [new EmbedBuilder().setTitle('🎯 Monopole !').setDescription(`Tu as monopolisé **${RESOURCE_EMOJI[res]} ${res}** !`).setColor(0xE67E22)],
                    components: []
                });
                await updateInterface(`<@${i.user.id}> a joué Monopole sur ${RESOURCE_EMOJI[res]} !`);
            }

            if (i.customId === 'yop_r1_select') {
                if (!await guardCurrentPlayer(i)) return;
                const r1 = i.values[0];
                const s = new StringSelectMenuBuilder()
                    .setCustomId('yop_r2_select_' + r1)
                    .setPlaceholder('Deuxième ressource')
                    .addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT).map(r => ({ label: RESOURCE_EMOJI[r] + ' ' + r, value: r })));
                await i.update({
                    embeds: [new EmbedBuilder().setTitle('🎁 Abondance — Choisis la 2ème ressource').setDescription(`Tu as choisi **${RESOURCE_EMOJI[r1 as ResourceType]} ${r1}**. Choisis ta deuxième ressource.`).setColor(0x3498DB)],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)]
                });
            }

            if (i.customId.startsWith('yop_r2_select_')) {
                if (!await guardCurrentPlayer(i)) return;
                const r1 = i.customId.split('_')[3] as ResourceType;
                const r2 = i.values[0] as ResourceType;
                currentGame!.playDevCard(i.user.id, DevCardType.YEAR_OF_PLENTY, { r1, r2 });
                await i.update({
                    embeds: [new EmbedBuilder().setTitle('🎁 Abondance !').setDescription(`Tu as reçu **${RESOURCE_EMOJI[r1]} ${r1}** et **${RESOURCE_EMOJI[r2]} ${r2}** !`).setColor(0x3498DB)],
                    components: []
                });
                await updateInterface(`<@${i.user.id}> a joué Abondance !`);
            }

            if (i.customId === 'trade_bank_give') {
                if (!await guardCurrentPlayer(i)) return;
                const give = i.values[0];
                const s = new StringSelectMenuBuilder().setCustomId('trade_bank_get_' + give)
                    .setPlaceholder('Quelle ressource veux-tu recevoir ?')
                    .addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT && r !== give).map(r => ({ label: RESOURCE_EMOJI[r] + ' ' + r, value: r })));
                await i.update({
                    embeds: [new EmbedBuilder()
                        .setTitle('🏦 Échange Banque — Étape 2/2')
                        .setDescription(`Tu donnes **${RESOURCE_EMOJI[give as ResourceType] ?? ''} ${give}**. Que veux-tu recevoir en échange ?`)
                        .setColor(0x95A5A6)
                    ],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)]
                });
            }

            if (i.customId.startsWith('trade_bank_get_')) {
                if (!await guardCurrentPlayer(i)) return;
                const give = i.customId.split('_')[3] as ResourceType;
                const get = i.values[0] as ResourceType;
                if (currentGame!.tradeWithBank(i.user.id, give, get)) {
                    await i.update({
                        embeds: [new EmbedBuilder().setTitle('✅ Échange effectué !').setDescription(`Tu as échangé des **${give}** contre **1 ${get}**.`).setColor(0x2ECC71)],
                        components: []
                    });
                    await updateInterface(`<@${i.user.id}> a échangé ${RESOURCE_EMOJI[give]} contre ${RESOURCE_EMOJI[get]} avec la banque.`);
                } else {
                    await i.update({
                        embeds: [new EmbedBuilder().setTitle('❌ Échange impossible').setDescription('Tu n\'as pas assez de ressources pour cet échange.').setColor(0xE74C3C)],
                        components: []
                    });
                }
            }

            if (i.customId === 'trade_p_offer') {
                if (!await guardCurrentPlayer(i)) return;
                const offerValues = i.values;
                pendingActions.set(i.user.id, { ...(pendingActions.get(i.user.id) ?? {}), tradeOffer: offerValues });
                const wantOptions = Object.values(ResourceType)
                    .filter(r => r !== ResourceType.DESERT)
                    .flatMap(r => [1, 2, 3].map(n => ({ label: `${RESOURCE_EMOJI[r]} ${r} n°${n}`, value: `${r}_${n}` })));
                const s = new StringSelectMenuBuilder()
                    .setCustomId('trade_p_want')
                    .setPlaceholder('Ressources que tu veux recevoir (1 à 5)')
                    .setMinValues(1)
                    .setMaxValues(5)
                    .addOptions(wantOptions.slice(0, 25));
                await i.update({
                    embeds: [new EmbedBuilder()
                        .setTitle('👥 Échange — Ce que tu veux')
                        .setDescription('Tu proposes : ' + offerValues.map(v => `${RESOURCE_EMOJI[v.split('_')[0] as ResourceType]} ${v.split('_')[0]}`).join(', ') + '\n\nSélectionne ce que tu veux **recevoir**.')
                        .setColor(0x3498DB)
                    ],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)]
                });
            }

            if (i.customId === 'trade_p_want') {
                if (!await guardCurrentPlayer(i)) return;
                const offerValues: string[] = pendingActions.get(i.user.id)?.tradeOffer ?? [];
                const wantValues = i.values;
                pendingActions.delete(i.user.id);
                const giveMap: Partial<Record<ResourceType, number>> = {};
                offerValues.forEach(v => { const t = v.split('_')[0] as ResourceType; giveMap[t] = (giveMap[t] ?? 0) + 1; });
                const getMap: Partial<Record<ResourceType, number>> = {};
                wantValues.forEach(v => { const t = v.split('_')[0] as ResourceType; getMap[t] = (getMap[t] ?? 0) + 1; });
                const giveStr = Object.entries(giveMap).map(([r, q]) => `${q}× ${RESOURCE_EMOJI[r as ResourceType]} ${r}`).join(', ');
                const getStr = Object.entries(getMap).map(([r, q]) => `${q}× ${RESOURCE_EMOJI[r as ResourceType]} ${r}`).join(', ');
                const giveEncoded = offerValues.map(v => v.replace(/_/g, '.')).join('_');
                const getEncoded = wantValues.map(v => v.replace(/_/g, '.')).join('_');
                const acceptId = `accept_trade_${i.user.id}_${giveEncoded}_FOR_${getEncoded}`;
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId(acceptId.slice(0, 100))
                        .setLabel('✅ Accepter')
                        .setStyle(ButtonStyle.Success)
                );
                if (CHANNELS.COMMERCE) {
                    const c = client.channels.cache.get(CHANNELS.COMMERCE) as TextChannel;
                    if (c) {
                        const msg = await c.send({
                            embeds: [new EmbedBuilder()
                                .setTitle('🤝 Proposition d\'Échange')
                                .setDescription(`<@${i.user.id}> propose :\n**Donne** : ${giveStr}\n**Veut** : ${getStr}`)
                                .setColor(0xE8A838)
                            ],
                            components: [row]
                        });
                        pendingTradeOffers.push(msg);
                    }
                }
                await i.update({
                    embeds: [new EmbedBuilder().setTitle('📨 Offre envoyée !').setDescription(`Tu proposes **${giveStr}** contre **${getStr}**.`).setColor(0x2ECC71)],
                    components: []
                });
            }

            if (i.customId === 'select_spot') {
                if (!await guardCurrentPlayer(i)) return;
                const a = pendingActions.get(i.user.id);
                if (!a) return;
                let ok = false;

                if (a.type === 'settlement') ok = currentGame!.buildSettlement(i.user.id, i.values[0]);
                else if (a.type === 'city') ok = currentGame!.buildCity(i.user.id, i.values[0]);
                else if (a.type === 'road') ok = currentGame!.buildRoad(i.user.id, i.values[0]);
                else if (a.type === 'robber_move') {
                    const res = currentGame!.moveRobber(i.values[0], i.user.id);
                    if (res.success && res.victims.length > 0) {
                        const s = new StringSelectMenuBuilder()
                            .setCustomId('steal_select')
                            .setPlaceholder('Choisis un joueur à voler')
                            .addOptions(res.victims.map(v => ({
                                label: currentGame!.players.find(pl => pl.id === v)!.username + ' (clic pour voler)',
                                value: v
                            })));
                        await i.update({
                            embeds: [new EmbedBuilder()
                                .setTitle('🕵️ Qui vas-tu voler ?')
                                .setDescription('Sélectionne un joueur. Tu lui voleras **1 ressource aléatoire**.')
                                .setColor(0x8E44AD)
                            ],
                            components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)]
                        });
                        return;
                    }
                    ok = res.success;
                }

                pendingActions.delete(i.user.id);

                if (ok) {
                    const confirmLabels: Record<string, string> = {
                        settlement: '🏠 Colonie posée avec succès !',
                        road: '🛣️ Route construite avec succès !',
                        city: '🏙️ Ville construite avec succès !',
                        robber_move: '😈 Voleur déplacé !'
                    };
                    await i.update({
                        embeds: [new EmbedBuilder().setTitle(confirmLabels[a.type] ?? '✅ Action effectuée').setColor(0x2ECC71)],
                        components: [],
                        files: []
                    });
                    const logLabels: Record<string, string> = {
                        settlement: `<@${i.user.id}> a posé une colonie.`,
                        road: `<@${i.user.id}> a construit une route.`,
                        city: `<@${i.user.id}> a construit une ville.`,
                        robber_move: `<@${i.user.id}> a déplacé le voleur.`
                    };
                    await updateInterface(logLabels[a.type] ?? `<@${i.user.id}> a effectué une action.`);
                }
            }

            if (i.customId === 'steal_select') {
                if (!await guardCurrentPlayer(i)) return;
                const stolen = currentGame!.stealCard(i.user.id, i.values[0]);
                const victim = currentGame!.players.find(p => p.id === i.values[0]);
                await i.update({
                    embeds: [new EmbedBuilder()
                        .setTitle('🕵️ Vol réussi !')
                        .setDescription(stolen
                            ? `Tu as volé **1× ${RESOURCE_EMOJI[stolen] ?? stolen} ${stolen}** à **${victim?.username ?? '?'}**.`
                            : `**${victim?.username ?? '?'}** n\'avait aucune ressource.`)
                        .setColor(0x8E44AD)
                    ],
                    components: []
                });
                await updateInterface(`<@${i.user.id}> a volé une ressource à **${victim?.username ?? '?'}**.`);
            }

            if (i.customId === 'discard_select') {
                if (!await guardInGame(i)) return;
                const res: Partial<Record<ResourceType, number>> = {};
                i.values.forEach(v => { const type = v.split('_')[0] as ResourceType; res[type] = (res[type] ?? 0) + 1; });
                if (currentGame!.discard(i.user.id, res)) {
                    const discardStr = Object.entries(res).map(([r, q]) => `${q}× ${RESOURCE_EMOJI[r as ResourceType] ?? r}`).join(', ');
                    await i.update({
                        embeds: [new EmbedBuilder()
                            .setTitle('🗑️ Défausse effectuée')
                            .setDescription(`Tu as défaussé : **${discardStr}**.`)
                            .setColor(0x27AE60)
                        ],
                        components: []
                    });
                    await updateInterface(`<@${i.user.id}> a défaussé des ressources.`);
                } else {
                    await i.update({
                        embeds: [new EmbedBuilder().setTitle('❌ Erreur').setDescription('Impossible d\'effectuer cette défausse.').setColor(0xE74C3C)],
                        components: []
                    });
                }
            }
        }
    } catch (e) {
        console.error(e);
    }
});

client.login(process.env.DISCORD_TOKEN);

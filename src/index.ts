import {
    Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle,
    AttachmentBuilder, StringSelectMenuBuilder, TextChannel, Message,
    EmbedBuilder, MessageFlags
} from 'discord.js';
import { config } from 'dotenv';
import { CatanEngine } from './CatanEngine.js';
import { MapRenderer } from './MapRenderer.js';
import { GamePhase, ResourceType } from './core/types.js';
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
            return `${isCurrent ? '▶ ' : ''}**${pl.username}** — ${pl.victoryPoints} PV ${extras}`;
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

async function sendTurnDM(player: any, row: ActionRowBuilder<ButtonBuilder>, embed: EmbedBuilder): Promise<Message | null> {
    try {
        const user = await client.users.fetch(player.id);
        return await user.send({ embeds: [embed], components: [row] });
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

async function updateInterface(logMsg: string = ''): Promise<void> {
    if (!currentGame) return;
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

        const row = new ActionRowBuilder<ButtonBuilder>();

        if (currentGame.state === GamePhase.PLAYING) {
            if (!currentGame.hasRolled) {
                row.addComponents(
                    new ButtonBuilder().setCustomId('roll_dice').setLabel('🎲 Lancer les Dés').setStyle(ButtonStyle.Primary)
                );
            } else {
                row.addComponents(
                    new ButtonBuilder().setCustomId('build_settlement').setLabel('🏠 Colonie').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('build_road').setLabel('🛣️ Route').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('build_city').setLabel('🏙️ Ville').setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId('trade_btn').setLabel('🤝 Échange').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('end_turn').setLabel('⭐ Fin du tour').setStyle(ButtonStyle.Secondary)
                );
            }
        } else if (currentGame.state === GamePhase.ROBBER_MOVE) {
            row.addComponents(
                new ButtonBuilder().setCustomId('move_robber_btn').setLabel('😈 Déplacer le Voleur').setStyle(ButtonStyle.Danger)
            );
        } else if (currentGame.state === GamePhase.DISCARDING) {
            row.addComponents(
                new ButtonBuilder().setCustomId('discard_btn').setLabel('🗑️ Défausser des Ressources').setStyle(ButtonStyle.Danger)
            );
        } else if (currentGame.state !== GamePhase.FINISHED) {
            if (currentGame.setupStep === 'SETTLEMENT') {
                row.addComponents(
                    new ButtonBuilder().setCustomId('setup_settlement').setLabel('🏠 Poser une Colonie').setStyle(ButtonStyle.Success)
                );
            } else {
                row.addComponents(
                    new ButtonBuilder().setCustomId('setup_road').setLabel('🛣️ Poser une Route').setStyle(ButtonStyle.Success)
                );
            }
        }

        if (currentGame.state === GamePhase.DISCARDING) {
            const toDiscardPlayers = currentGame.players.filter(
                pl => currentGame!.getPlayerResourceCount(pl.id) > 7 && !currentGame!.discardedPlayers.has(pl.id)
            );
            await Promise.all(toDiscardPlayers.map(pl => sendTurnDM(pl, row, buildTurnEmbed(currentGame!, pl.id))));
            const waitingPlayers = currentGame.players.filter(
                pl => !toDiscardPlayers.some(d => d.id === pl.id)
            );
            await Promise.all(waitingPlayers.map(pl => sendWaitDM(pl, 'tous (défausse en cours)', currentGame!)));
        } else {
            TurnDMMessage = await sendTurnDM(currentGame.currentPlayer, row, buildTurnEmbed(currentGame, currentGame.currentPlayer.id));
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
                        await boardMessage.edit({ content: msg, components: [row] });
                    } catch {
                        boardMessage = await c.send({ content: msg, components: [row] });
                    }
                } else {
                    boardMessage = await c.send({ content: msg, components: [row] });
                }
            }
        }

        const winner = currentGame.players.find(pl => pl.victoryPoints >= 10);
        if (winner) {
            currentGame.state = GamePhase.FINISHED;
            if (CHANNELS.JOURNAL) {
                const c = client.channels.cache.get(CHANNELS.JOURNAL) as TextChannel;
                if (c) await c.send('🏆 **VICTOIRE** : <@' + winner.id + '> a gagné avec **' + winner.victoryPoints + ' PV** !');
            }
            await Promise.all(currentGame.players.map(async pl => {
                try {
                    const user = await client.users.fetch(pl.id);
                    const isWinner = pl.id === winner.id;
                    const endEmbed = new EmbedBuilder()
                        .setTitle(isWinner ? '🏆 Tu as gagné !' : '🎮 Fin de partie !')
                        .setDescription(isWinner
                            ? `Félicitations ! Tu as atteint **${winner.victoryPoints} PV** et remporté la partie !`
                            : `**${winner.username}** a remporté la partie avec **${winner.victoryPoints} PV**.\nTu as terminé avec **${pl.victoryPoints} PV**.`)
                        .addFields({
                            name: '📊 Classement final',
                            value: currentGame!.players
                                .sort((a, b) => b.victoryPoints - a.victoryPoints)
                                .map((p, idx) => `${idx + 1}. **${p.username}** — ${p.victoryPoints} PV`)
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
                const embed = new EmbedBuilder()
                    .setTitle('🎒 Tes Ressources')
                    .setDescription(formatResources(p.resources))
                    .addFields(
                        { name: '⭐ Points de Victoire', value: String(p.victoryPoints), inline: true },
                        { name: '🃏 Cartes Dev', value: String(p.devCards.length), inline: true },
                        { name: '🛣️ Routes posées', value: String(15 - p.stock.roads), inline: true }
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

            if (i.customId === 'trade_btn') {
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
                const s = new StringSelectMenuBuilder().setCustomId('trade_bank_give')
                    .setPlaceholder('Quelle ressource veux-tu donner ?')
                    .addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT).map(r => ({ label: RESOURCE_EMOJI[r] + ' ' + r, value: r })));
                await i.update({
                    embeds: [new EmbedBuilder().setTitle('🏦 Échange Banque — Étape 1/2').setDescription('Sélectionne la ressource que tu veux **donner** à la banque.').setColor(0x95A5A6)],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)]
                });
            }

            if (i.customId === 'trade_player_init') {
                const s = new StringSelectMenuBuilder().setCustomId('trade_p_give')
                    .setPlaceholder('Quelle ressource proposes-tu ?')
                    .addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT).map(r => ({ label: RESOURCE_EMOJI[r] + ' ' + r, value: r })));
                await i.update({
                    embeds: [new EmbedBuilder().setTitle('👥 Échange Joueur — Étape 1/2').setDescription('Sélectionne la ressource que tu veux **proposer**.').setColor(0x3498DB)],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)]
                });
            }

            if (i.customId.startsWith('accept_trade_')) {
                const parts = i.customId.split('_');
                const p1Id = parts[2], resGive = parts[3], resGet = parts[4];
                if (i.user.id === p1Id) return i.reply({ content: '❌ Tu ne peux pas accepter ton propre échange.', flags: MessageFlags.Ephemeral });
                if (currentGame.executeTrade(p1Id, i.user.id, { [resGive as ResourceType]: 1 }, { [resGet as ResourceType]: 1 })) {
                    await i.update({ content: '✅ Échange accepté !', components: [] });
                    await updateInterface(`<@${i.user.id}> a accepté l\'échange de <@${p1Id}> (${RESOURCE_EMOJI[resGive as ResourceType] ?? resGive} ↔ ${RESOURCE_EMOJI[resGet as ResourceType] ?? resGet}).`);
                } else {
                    await i.reply({ content: '❌ Ressources insuffisantes pour effectuer cet échange.', flags: MessageFlags.Ephemeral });
                }
            }

            if (i.customId === 'discard_btn') {
                const p = currentGame.players.find(pl => pl.id === i.user.id)!;
                const total = currentGame.getPlayerResourceCount(i.user.id);
                const toDiscard = Math.floor(total / 2);
                const options: { label: string, value: string }[] = [];
                Object.entries(p.resources).forEach(([res, qty]) => {
                    if (qty > 0) options.push({ label: `${RESOURCE_EMOJI[res as ResourceType] ?? ''} ${res} (×${qty})`, value: res });
                });
                if (options.length === 0) return i.reply({ content: '❌ Aucune ressource à défausser.', flags: MessageFlags.Ephemeral });
                const s = new StringSelectMenuBuilder()
                    .setCustomId('discard_select')
                    .setPlaceholder(`Sélectionne exactement ${toDiscard} ressource(s) à défausser`)
                    .setMinValues(toDiscard)
                    .setMaxValues(Math.min(toDiscard, options.length))
                    .addOptions(options);
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
                const type = i.customId.includes('settlement') ? 'settlement' : (i.customId.includes('road') ? 'road' : 'city');
                let spots: any[] = [];
                if (type === 'settlement') spots = currentGame.getPlaceableNodes(i.user.id);
                else if (type === 'road') spots = currentGame.getPlaceableEdges(i.user.id);
                else spots = currentGame.getUpgradableSettlements(i.user.id);

                if (spots.length === 0) {
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
                currentGame.nextTurn();
                await i.deferUpdate();
                await i.editReply({ components: [] });
                await updateInterface(`<@${i.user.id}> a terminé son tour.`);
            }
        }

        if (i.isStringSelectMenu()) {
            if (i.customId === 'trade_bank_give') {
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

            if (i.customId === 'trade_p_give') {
                const give = i.values[0];
                const s = new StringSelectMenuBuilder().setCustomId('trade_p_get_' + give)
                    .setPlaceholder('Quelle ressource veux-tu en échange ?')
                    .addOptions(Object.values(ResourceType).filter(r => r !== ResourceType.DESERT && r !== give).map(r => ({ label: RESOURCE_EMOJI[r] + ' ' + r, value: r })));
                await i.update({
                    embeds: [new EmbedBuilder()
                        .setTitle('👥 Échange Joueur — Étape 2/2')
                        .setDescription(`Tu proposes **${RESOURCE_EMOJI[give as ResourceType] ?? ''} ${give}**. Que veux-tu en échange ?`)
                        .setColor(0x3498DB)
                    ],
                    components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(s)]
                });
            }

            if (i.customId.startsWith('trade_p_get_')) {
                const give = i.customId.split('_')[3];
                const get = i.values[0];
                const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                        .setCustomId('accept_trade_' + i.user.id + '_' + give + '_' + get)
                        .setLabel('✅ Accepter cet échange')
                        .setStyle(ButtonStyle.Success)
                );
                if (CHANNELS.COMMERCE) {
                    const c = client.channels.cache.get(CHANNELS.COMMERCE) as TextChannel;
                    if (c) await c.send({
                        embeds: [new EmbedBuilder()
                            .setTitle('🤝 Proposition d\'Échange')
                            .setDescription(`<@${i.user.id}> propose **1× ${RESOURCE_EMOJI[give as ResourceType] ?? give} ${give}** contre **1× ${RESOURCE_EMOJI[get as ResourceType] ?? get} ${get}**.\n\nCliquez sur le bouton pour accepter.`)
                            .setColor(0xE8A838)
                        ],
                        components: [row]
                    });
                }
                await i.update({
                    embeds: [new EmbedBuilder().setTitle('📨 Offre envoyée !').setDescription('Ta proposition a été publiée dans #commerce.').setColor(0x2ECC71)],
                    components: []
                });
            }

            if (i.customId === 'select_spot') {
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
                const res: Partial<Record<ResourceType, number>> = {};
                i.values.forEach(v => { res[v as ResourceType] = (res[v as ResourceType] ?? 0) + 1; });
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

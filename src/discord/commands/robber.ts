//APIEmbedField.name
//Le but étant dans un premier temps, parcourir les joueurs, 
// ensuite compter cartes. Si cartes > 7, 
// alors défausser nombre cartes
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player } from '../../core/types.js';

 // Affiche "/rules" dans le Discord
  data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Affiche les règles du jeu"),

  // Discord interagit avec la commande /game
  async execute(interaction: CommandInteraction) {

    // Embed affiche consignes
    const embed = new EmbedBuilder()
      .setTitle("📜 Règles des Colons de Catane") // Titre principal de l'embed
      .setColor(0xE8A838)
  }




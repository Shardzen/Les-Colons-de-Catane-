//APIEmbedField.name
//Le but étant dans un premier temps, parcourir les joueurs, 
// ensuite compter cartes. Si cartes > 7, 
// alors défausser nombre cartes
import { SlashCommandBuilder, CommandInteraction, EmbedBuilder } from 'discord.js';
import { GameManager } from '../../core/gameManager.js';
import { Player } from '../../core/types.js';

  data: new SlashCommandBuilder()
    .setName("robber")
    .setDescription("Logique du voleur"),

  // Discord interagit avec la commande /game
  async execute(interaction: CommandInteraction) {

// Si un joueur a plus de 7 cartes, alors doit défausser
function Discard(player: Player): boolean {
  const nbcards = getResources(player);
  return nbcards > 7;
}

// Obtenir le nombre de cartes à défausser
function getDiscard(player: Player): number {
  const nbcards = getResources(player);
  return Math.floor(nbcards / 2); // Tous les joueurs qui possèdent plus de 7 cartes ressources doivent se défausser de la moitié de leurs cartes
  // Fonction Math floor qui génère un nombre Arrondi en faveur du joueur
}

// Calculer les ressources totales d'un joueur
function getResources(player: Player): number {
//Que faut-il faire après ? Calculer nb ressources du joueur en question et mettre en commun avec le voleur ?
}

// Action de défausser les cartes
function discardResources(player: Player, toDiscard: ResourceMap): Player {
// Quelle formule de code pour cette partie ? Pas réussi à trouver

  // Vérifier que le joueur défausse le bon nombre
  if (discard !== getDiscard(player)) {
    throw new Error(`Vous devez défausser exactement ${getDiscard(player)} cartes.`);
  }



    // Embed affiche règle du voleur
    const embed = new EmbedBuilder()
      .setTitle("Principe du voleur") // Titre principal de l'embed
      .setColor(0xE8A838)
  }


}

/**
 * INDEX.TS - ENGINE SANDBOX
 * Ce fichier sert uniquement à tester la logique pure du jeu
 * avant de l\\'intégrer dans Discord.
 */

import { GameManager } from \"./core/gameManager.js\";

console.log(\"--- Démarrage du Core Engine Sandbox ---\");

const testPlayers = [
  { id: \"123\", username: \"Joueur 1\", color: \"RED\" as const },
  { id: \"456\", username: \"Joueur 2\", color: \"BLUE\" as const }
];

const engine = new GameManager(testPlayers);
const state = engine.getState();

console.log(`Partie initialisée ID: ${state.gameId}`);
console.log(`Nombre de tuiles générées: ${state.board.tiles.length}`);
console.log(`Phase actuelle: ${state.phase}`);

// Simuler un lancer de dés
console.log(\"\\nSimuler un lancer de dés...\");
const response = engine.execute({ type: \"ROLL_DICE\", playerId: \"123\" });

if (response.success) {
  console.log(`Résultat: ${response.state.dice}`);
  console.log(`Nouvelle phase: ${response.state.phase}`);
} else {
  console.error(`Erreur: ${response.error?.details}`);
}

console.log(\"\\n--- Moteur prêt pour intégration ---\");

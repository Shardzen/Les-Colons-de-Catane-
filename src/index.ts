/**
 * INDEX.TS - ENGINE SANDBOX
 * Ce fichier sert uniquement � tester la logique pure du jeu
 * avant de l\\'int�grer dans Discord.
 */

import { GameManager } from "./core/gameManager.js";

console.log("--- D�marrage du Core Engine Sandbox ---");

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

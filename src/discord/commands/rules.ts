import { SlashCommandBuilder, CommandInteraction, EmbedBuilder, embedLength } from "discord.js";

export const rulesCommand = {

  data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Affiche les règles du jeu"),



  async execute(interaction: CommandInteraction) {

const embed1 = new EmbedBuilder()
                    .setTitle("📜 Règles des Colons de Catane")
                    .setColor(0xE8A838)
                    .setDescription("Bienvenue sur l'île de Catane !")

                    .setImage("https://m.media-amazon.com/images/I/91iOb49w2fL._AC_UF350,350_QL80_.jpg")
                    .setDescription("Bienvenue sur l'île de Catane ! Voici tout ce qu'il faut savoir pour devenir le maître de l'île.")
                    .addFields(
                        { name: "🎯 But du Jeu", value: "Soyez le premier à atteindre **10 Points de Victoire (PV)**." },
      )
const embed2 = new EmbedBuilder()
                    .setTitle("🏗️ Coûts de Construction")
                    .setImage("https://i.etsystatic.com/22460503/r/il/d33fbb/5377814192/il_1080xN.5377814192_afp7.jpg")
                    .setDescription("🛣️ **Route** : 🌲1 Bois + 🧱1 Argile\n🏠 **Colonie** : 🌲1 Bois + 🧱1 Argile + 🐑1 Laine + 🌾1 Blé (Vaut **1 PV**)\n🏙️ **Ville** : ⛰️3 Minerais + 🌾2 Blés (Vaut **2 PV**)\n🃏 **Carte Dev** : ⛰️1 Minerai + 🐑1 Laine + 🌾1 Blé")
                    .addFields(
                        { name: "🎲 Déroulement d'un tour", value: "1. **Récolte** : Lancez les dés. Si le total correspond à une case où vous avez un bâtiment, vous gagnez la ressource.\n2. **Commerce** : Échangez vos ressources avec la banque (4:1) ou les ports.\n3. **Construction** : Utilisez vos ressources pour bâtir et gagner des points." }
                    )
const embed3 = new EmbedBuilder()
                    .setTitle("😈 Le Voleur (Le 7)")
                    .setImage("https://i.ebayimg.com/images/g/T30AAOSwk8hgVjuC/s-l1200.jpg")
                    .setDescription("Si vous faites un 7, personne ne reçoit de ressources. Le joueur actif déplace le Voleur pour bloquer une case et voler une ressource à un adversaire.")
                    .setColor(0xE67E22)
const embed4 = new EmbedBuilder()
                    .setTitle("💡 Astuces : Les Villes rapportent double production (2 ressources au lieu d'une). \n Respectez la règle de distance : il faut toujours 2 intersections vides entre chaque colonie.")
                    .setFooter({ text: "Utilisez les boutons dans #commerce-public pour jouer !" });
          

 const embed5 = new EmbedBuilder()
                    .setTitle("🃏 Cartes de Développement")
                    .setImage("https://cdn.shopify.com/s/files/1/0767/8027/3966/files/dev-cards-jpg_276e3d87-080f-4611-83be-e66aa50a4d5a_480x480.webp?v=1691764035")
                    .addFields( { name: "⚔️ Chevalier", value: "Déplace le voleur et vole une ressource." },
                                { name: "🎯 Monopole", value: "Prend toutes les ressources d'un type à tous les joueurs." },
                                { name: "🎁 Abondance", value: "Prend 2 ressources de son choix dans la banque." },
                                { name: "🛣️ Route", value: "Pose 2 routes gratuitement." },
                                { name: "⭐ Point de Victoire", value: "Vaut **1 PV**." })
                    .setColor("#9B59B6");
const embed6 = new EmbedBuilder()
                    .setTitle("🏆 Bonus")
                    .addFields(
                                { name: "⚔️ Armée la Plus Puissante", value: "Jouez **3 chevaliers minimum** pour obtenir **2 PV bonus**. Si un autre joueur en joue plus, il prend le bonus." },
                                { name: "🛣️ Route la Plus Longue", value: "Ayez **5 routes consécutives minimum** pour obtenir **2 PV bonus**. Si un autre joueur fait plus long, il prend le bonus." })
                    .setColor("#E74C3C")

                     .setFooter({ text: "Bonne chance à tous !" });
        

    await interaction.reply({ embeds: [embed1, embed2, embed3, embed4, embed5, embed6] });
          
            }
          }
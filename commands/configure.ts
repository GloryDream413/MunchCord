import { RoleSelectMenuBuilder } from "@discordjs/builders";
import {
  ActionRowBuilder,
  ComponentType,
  SlashCommandBuilder,
} from "discord.js";
import { getDb } from "../db";

export default {
  data: new SlashCommandBuilder()
    .setName("configure")
    .setDescription("Register inscription ids.")
    .addStringOption((option) =>
      option
        .setName("input")
        .setDescription("The inscription ids")
        .setRequired(true)
    ),
  async execute(interaction) {
    const input = interaction.options.getString("input");
    const newInscriptions = input.split(" ");
    const roleSelectMenu = new RoleSelectMenuBuilder()
      .setCustomId("select")
      .setPlaceholder("server role.");

    const row = new ActionRowBuilder().addComponents(roleSelectMenu);
    await interaction.reply({
      content: "Select role for the users",
      components: [row],
    });
    // Collect select menu interactions
    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.RoleSelect,
      time: 10000, // optional, time in milliseconds to collect interactions
    });

    collector.on("collect", async (interaction) => {
      const roleId = interaction.values[0];
      const db = getDb();
      await db.collection("inscriptions").insertOne({inscriptionId:newInscriptions[0], role:roleId});
      await interaction.reply(`You selected ${roleId}`);
    });
  },
};

import {
  ActionRowBuilder,
  ButtonStyle,
  Collection,
  Embed,
  Events,
  GuildMember,
  ModalBuilder,
  REST,
  Routes,
  TextChannel,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
import { connect, getDb } from "./db";
import { verify_signature } from "./bitcoin-rpc";
import configureCommand from "./commands/configure";
import verifyCommand from "./commands/verify";
import randomWords from "random-words";
import {
  AnyComponentBuilder,
  ButtonBuilder,
  EmbedBuilder,
} from "@discordjs/builders";

// Creating a new Discord client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// Creating a collection to store all commands
client["commands"] = new Collection();
// Adding the configure and verify commands to the collection
client["commands"].set(configureCommand.data.name, configureCommand);
client["commands"].set(verifyCommand.data.name, verifyCommand);

// Creating an array of all the commands in JSON format
const commands = [configureCommand.data.toJSON(), verifyCommand.data.toJSON()];

// Creating a new REST instance to communicate with Discord API
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

// Updating the verifyed application commands with the commands array
(async () => {
  try {
    await connect();
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), {
      body: commands,
    });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

// Handling the 'ready' event, which fires when the client is ready
client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Handling the 'InteractionCreate' event, which fires when a user interacts with a slash command
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client["commands"].get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

// Handling the 'InteractionCreate' event again, but for the modal submit event
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  const member = interaction.guild.members.cache.get(interaction.user.id);
  const inscriptionId = interaction.fields.fields.get("inscriptionId").value;
  const signature = interaction.fields.fields.get("signature").value;
  if (!inscriptionId || !signature) {
    interaction.reply({ content: "Invalid input", ephemeral: true });
    return;
  }
  const inscriptionInfo = (
    await axios.get(process.env.INSCRIPTION_API + "/" + inscriptionId)
  ).data;
  //console.log(inscriptionInfo);
  try {
    const result = await verify_signature({
      address: inscriptionInfo.address,
      signature,
      message: "munch munch",
    });
    if (result.error) throw new Error(result.error);
    const db = getDb();
    const inscription = await db
      .collection("inscriptions")
      .findOne({ inscriptionId });
    const role = interaction.guild.roles.cache.get(inscription.role);
    console.log(member);

    interaction.reply({ content: "You are approved" });
  } catch (e) {
    interaction.reply({ content: "Signature mismatch", ephemeral: true });
  }
});

// When a new member joins the server
client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
  console.log("new member", member.user);
  const channel = client.channels.cache.find(
    (ch) => ch["name"] == "general"
  );

  if (!channel) return;
  console.log("channel", channel);
  // (channel as TextChannel).send(`Welcome to the server, ${member}! Will you verify now? /verify`);
  // const channel = member.guild.systemChannel;
  if (!channel) return;

  // Send the embed as a message in the system channel
  try {
    const channel = member.guild.systemChannel;
    // create a new message action row
    const row = new ActionRowBuilder();

    // create a new message button
    const button = new ButtonBuilder()
      .setCustomId("btn-verify") // set a custom ID for the button
      .setLabel("verify") // set the label of the button
      .setStyle(ButtonStyle.Primary);

    // add the button to the message action row
    row.addComponents(button);

    // send the message with the action row containing the button
    channel.send({ content: `Welcome ${member}`, components: [row as any] });
    // Add a reaction to the message
  } catch (error) {
    console.error(`Failed to send welcome message: ${error}`);
  }
});

// Handle the verify button click
client.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isButton()) return;
  verifyCommand.execute(interaction);
});

// Discord bot login
client.login(process.env.TOKEN);

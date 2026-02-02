const { EmbedBuilder, AttachmentBuilder } = require("discord.js");
const { pool } = require("../functions/database");
const selectCharacterHandler = require("../dropdown/selectCharacter");
const updateHandler = require("../dropdown/update");
const deleteHandler = require("../dropdown/deleteMenu");
const changeHandler = require("../dropdown/changeMenu");
const selectDeleteCharacter = require("../dropdown/selectDeleteCharacter");

// Helper function untuk safe reply
async function safeReply(interaction, content) {
  try {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply(content);
    } else if (interaction.deferred) {
      await interaction.editReply(content);
    } else {
      await interaction.followUp(content);
    }
  } catch (error) {
    console.error('Failed to send interaction response:', error.message);
  }
}

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (interaction.isCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        console.error(
          `No handler found for command: ${interaction.commandName}`
        );
        return;
      }
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await safeReply(interaction, {
          content: "There was an error executing this command!",
          ephemeral: true,
        });
      }
    } else if (interaction.isButton()) {
      const handler =
        client.buttons.get(interaction.customId) ||
        Array.from(client.buttons.values()).find(
          (h) =>
            h.customId instanceof RegExp &&
            h.customId.test(interaction.customId)
        );
      if (!handler) {
        console.error(
          `No handler found for button with customId: ${interaction.customId}`
        );
        return;
      }
      try {
        await handler.execute(interaction);
      } catch (error) {
        console.error(`Error executing button handler: ${error}`);
        await safeReply(interaction, {
          content: "❌ Terjadi kesalahan saat memproses tombol!",
          ephemeral: true,
        });
      }
    } else if (interaction.isModalSubmit()) {
      const handler =
        client.modals.get(interaction.customId) ||
        [...client.modals.values()].find(
          (h) =>
            h.customId instanceof RegExp &&
            h.customId.test(interaction.customId)
        );
      if (!handler) {
        console.error(
          `No handler found for modal with customId: ${interaction.customId}`
        );
        return;
      }
      try {
        await handler.execute(interaction);
      } catch (error) {
        console.error(`Error executing modal handler: ${error}`);
        // Gunakan safeReply untuk menghindari error "Unknown interaction"
        await safeReply(interaction, {
          content: "❌ Terjadi kesalahan saat memproses modal!",
          ephemeral: true,
        });
      }
    } else if (interaction.isSelectMenu()) {
      try {
        if (interaction.customId === "select_character_dropdown") {
          await selectCharacterHandler.execute(interaction);
        } else if (interaction.customId === "select_version") {
          await updateHandler.execute(interaction);
        } else if (interaction.customId === "deleteMenu") {
          await deleteHandler.execute(interaction);
        } else if (interaction.customId === "changeDropdown") {
          await changeHandler.execute(interaction);
        } else if (interaction.customId === "select_delete_character") {
          await selectDeleteCharacter.execute(interaction);
        }
      } catch (error) {
        console.error(`Error executing select menu handler: ${error}`);
        await safeReply(interaction, {
          content: "❌ Terjadi kesalahan saat memproses menu!",
          ephemeral: true,
        });
      }
    }
  },
};
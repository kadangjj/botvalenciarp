const fs = require("fs");
const path = require("path");

const FAQ_PATH = path.join(__dirname, "../../data/faq.json");

module.exports = {
  customId: "faq_modal",
  async execute(interaction) {
    const question = interaction.fields.getTextInputValue("question");
    const answer = interaction.fields.getTextInputValue("answer");

    let faqData = [];
    if (fs.existsSync(FAQ_PATH)) {
      faqData = JSON.parse(fs.readFileSync(FAQ_PATH, "utf8"));
    }

    faqData.push({ question, answer });

    fs.writeFileSync(FAQ_PATH, JSON.stringify(faqData, null, 2));

    await interaction.reply({
      content: `FAQ dengan pertanyaan **${question}** telah disimpan.`,
      ephemeral: true,
    });
  },
};

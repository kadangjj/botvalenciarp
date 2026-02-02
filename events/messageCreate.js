const fs = require("fs");
const path = require("path");

const FAQ_PATH = path.join(__dirname, "../data/faq.json");
const config = require("../config.json");

const FAQ_CHANNEL_ID = config.channels.Faqchannel;

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (!message.guild || message.author.bot) {
      return;
    }

    if (message.channel.id !== FAQ_CHANNEL_ID) {
      return;
    }

    let faqData = [];
    if (fs.existsSync(FAQ_PATH)) {
      faqData = JSON.parse(fs.readFileSync(FAQ_PATH, "utf8"));
    } else {
      return;
    }

    const question = message.content.trim().toLowerCase();
    if (!question) {
      return;
    }

    const foundFAQ = faqData.find((faq) => {
      console
        .log
        //`Mencocokkan "${faq.question.toLowerCase()}" dengan "${question}"`
        ();
      return faq.question.toLowerCase() === question;
    });

    if (foundFAQ) {
      //console.log(`Pertanyaan ditemukan: ${foundFAQ.question}`);
      message.reply(foundFAQ.answer);
    } else {
      //console.log("Pertanyaan tidak ditemukan.");
    }
  },
};

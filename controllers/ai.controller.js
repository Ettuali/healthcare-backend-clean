const chatServices = require("../services/chatServices");
console.log("Imported Services:", chatServices); // This should show { askHealthAI: [AsyncFunction: askHealthAI] }

const { askHealthAI } = chatServices;
const healthChat = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const response = await askHealthAI(question);

    res.json({ answer: response });

  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ message: "AI error" });
  }
};

module.exports = { healthChat };
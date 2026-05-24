const { GoogleGenAI } = require("@google/genai");

// Initialize with the new SDK client structure
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const askHealthAI = async (question) => {
  try {
    // USE THIS MODEL NAME FOR 2026 STABILITY
    const modelName = "gemini-2.5-flash"; 

const prompt = `
You are an AI healthcare assistant for a patient monitoring system.

Rules:
- Only answer healthcare-related questions.
- If unrelated, say: "I can only answer healthcare related questions."
- Give structured responses with:

1. Short explanation
2. Normal range (if applicable)
3. Possible causes
4. What the patient should do
5. When to worry (important)
6. Always end with: "Consult a doctor for professional advice."

- Keep answers clear, practical, and not overly long.
- Respond like a real healthcare support assistant, not a textbook.

User Question: ${question}
`;

    // The new SDK uses ai.models.generateContent
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    // Access the text directly from the response object
    return response.text; 

  } catch (error) {
    if (error.status === 429) {
      return "I'm currently handling too many requests. Please try again in 30 seconds. (Consult a doctor for advice.)";
    }
    console.error("AI Service Error:", error);
    throw new Error("AI failed to respond");
  }
};

module.exports = { askHealthAI };
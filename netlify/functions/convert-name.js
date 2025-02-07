
const Groq = require("groq-sdk");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { name } = JSON.parse(event.body);
    
    if (!name) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Name is required" }),
      };
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `
      Given this name: "${name}", create a Japanese version following these steps:
      1. Determine the meaning of the original name
      2. Translate the meaning to Japanese
      3. Create a new Japanese name that captures the essence
      4. Provide the name in kanji, hiragana, and romaji
      
      Return only a JSON object in this format:
      {
        "original_name": "input name",
        "name_meaning": "meaning of original name",
        "japanese_translation": "meaning in Japanese",
        "final_name": {
          "romaji": "name in romaji",
          "kanji": "name in kanji",
          "hiragana": "name in hiragana",
          "meaning_in_english": "meaning of the Japanese name"
        }
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "mixtral-8x7b-32768",
      temperature: 0.5,
      max_tokens: 1024,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: completion.choices[0].message.content,
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process request" }),
    };
  }
};

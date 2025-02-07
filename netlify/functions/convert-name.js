const Groq = require("groq-sdk");

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { name, culture } = JSON.parse(event.body);

    if (!name || !culture) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Name and culture are required" }),
      };
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || process.env.LOCAL_GROQ_API_KEY,
    });

    const prompt = `
      Given this name: "${name}" and target culture: "${culture}", create a culturally appropriate version following these steps:
      1. Research the original name's meaning and etymology
      2. Understand the cultural context and naming conventions of the target culture
      3. Translate the meaning and essence into the target culture
      4. Create a new name that captures the spirit of the original while respecting the target culture's traditions
      
      Cultural Guidelines:
      - Japanese: Use kanji, hiragana, and romaji
      - Chinese: Use simplified Chinese characters and pinyin
      - Korean: Use hangul and romanization
      - Arabic: Use Arabic script and romanization
      - Russian: Use Cyrillic and romanization
      - Greek: Use Greek alphabet and romanization
      - Hindi: Use Devanagari and romanization
      - Persian: Use Persian script and romanization
      - Thai: Use Thai script and romanization
      - Hebrew: Use Hebrew script and romanization
      
      Return only a JSON object in this format:
      {
        "original_name": "input name",
        "name_meaning": "meaning of original name",
        "cultural_translation": "meaning in target culture's language",
        "final_name": {
          "romanized": "name in roman alphabet",
          "native_script": "name in target culture's script",
          "pronunciation": "pronunciation guide",
          "meaning_in_english": "meaning of the new name"
        }
      }
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
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

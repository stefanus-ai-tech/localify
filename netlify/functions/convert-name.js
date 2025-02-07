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
      // Uses GROQ_API_KEY in production, falls back to VITE_LOCAL_GROQ_API_KEY in development
      apiKey: process.env.GROQ_API_KEY || process.env.LOCAL_GROQ_API_KEY,
    });
    console.log("Groq instance created");

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
    console.log("Prompt to Groq API:", prompt);

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 1024,
    });
    console.log("Groq API response:", completion);

    let responseContent = completion.choices[0].message.content;
    // Clean the response from any markdown formatting
    responseContent = responseContent.trim();
    responseContent = responseContent.replace(/^```(?:json)?|```$/g, "").trim();

    // Validate JSON before sending
    try {
      // Parse and stringify to ensure valid JSON
      const parsed = JSON.parse(responseContent);
      responseContent = JSON.stringify(parsed);
    } catch (error) {
      console.error("Invalid JSON from API:", error);
      console.log("Raw response:", responseContent);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid response from AI service" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: responseContent,
    };
  } catch (error) {
    console.error("Error in Groq API call:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process request" }),
    };
  }
};

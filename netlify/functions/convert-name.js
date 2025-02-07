const { Groq } = require("groq-sdk");

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const { name, culture } = JSON.parse(event.body);
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const prompt = `
      Given this name: "${name.trim()}" and target culture: "${culture}", create a culturally appropriate version following these steps:
      1. Research the original name's meaning and etymology
      2. Understand the cultural context and naming conventions of the target culture
      3. Translate the meaning and essence into the target culture
      4. Create a new name that captures the spirit of the original while respecting the target culture's traditions

      Return ONLY a JSON object in exactly this format, with no additional text or explanation:
      {
        "original_name": "input name",
        "name_meaning": "meaning of original name",
        "cultural_translation": "meaning in target culture's language",
        "final_name": {
          "native_script": "name in target culture's script",
          "romanized": "name in roman alphabet",
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

    let rawResponse = completion.choices[0].message.content.trim();

    // Remove any markdown formatting
    rawResponse = rawResponse.replace(/```json\n?|```/g, "").trim();

    // Ensure the response is valid JSON
    try {
      const parsedResponse = JSON.parse(rawResponse);

      // Validate required structure
      const validatedResponse = {
        original_name: parsedResponse.original_name || name,
        name_meaning: parsedResponse.name_meaning || "Unknown",
        cultural_translation: parsedResponse.cultural_translation || "",
        final_name: {
          native_script: parsedResponse.final_name?.native_script || "",
          romanized: parsedResponse.final_name?.romanized || "",
          pronunciation: parsedResponse.final_name?.pronunciation || "",
          meaning_in_english:
            parsedResponse.final_name?.meaning_in_english || "",
        },
      };

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedResponse),
      };
    } catch (parseError) {
      console.error("Parse error:", parseError);
      console.log("Raw response:", rawResponse);
      throw new Error("Invalid JSON response from AI");
    }
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to convert name",
        message: error.message,
      }),
    };
  }
};

import Groq from "groq-sdk";

export const handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

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

    const completion = await groq.chat.completions
      .create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 1024,
      })
      .catch((error) => {
        console.error("Groq API error:", error);
        throw new Error(`Groq API error: ${error.message}`);
      });

    let rawResponse = completion.choices[0].message.content.trim();

    // Remove any markdown formatting
    rawResponse = rawResponse.replace(/```json\n?|```/g, "").trim();

    // Ensure the response is valid JSON
    try {
      const parsedResponse = JSON.parse(rawResponse);

      // Sanitize all string values to ensure they're safe
      const sanitizeString = (str) => {
        if (typeof str !== "string") return "";
        return str
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
          .replace(/"/g, '\\"')
          .trim();
      };

      // Validate required structure with sanitized strings
      const validatedResponse = {
        original_name: sanitizeString(parsedResponse.original_name || name),
        name_meaning: sanitizeString(parsedResponse.name_meaning || "Unknown"),
        cultural_translation: sanitizeString(
          parsedResponse.cultural_translation || ""
        ),
        final_name: {
          native_script: sanitizeString(
            parsedResponse.final_name?.native_script || ""
          ),
          romanized: sanitizeString(parsedResponse.final_name?.romanized || ""),
          pronunciation: sanitizeString(
            parsedResponse.final_name?.pronunciation || ""
          ),
          meaning_in_english: sanitizeString(
            parsedResponse.final_name?.meaning_in_english || ""
          ),
        },
      };

      const safeResponse = JSON.stringify(validatedResponse, null, 2);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: safeResponse,
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Failed to convert name",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
    };
  }
};

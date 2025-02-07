import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NameResult {
  original_name: string;
  name_meaning: string;
  cultural_translation: string;
  final_name: {
    native_script: string;
    romanized: string;
    pronunciation: string;
    meaning_in_english: string;
  };
}

const countries = [
  { value: "japanese", label: "Japanese" },
  { value: "chinese", label: "Chinese" },
  { value: "korean", label: "Korean" },
  { value: "arabic", label: "Arabic" },
  { value: "russian", label: "Russian" },
  { value: "greek", label: "Greek" },
  { value: "hindi", label: "Hindi" },
  { value: "persian", label: "Persian" },
  { value: "thai", label: "Thai" },
  { value: "hebrew", label: "Hebrew" },
  { value: "elvish", label: "Elvish" },
  { value: "dragon", label: "Dragon" },
  { value: "lotr", label: "Lord of the Rings" },
  { value: "dwarvish", label: "Dwarvish" },
  { value: "goblin", label: "Goblin" },
  { value: "high_elven", label: "High Elven" },
];

const Index = () => {
  const [name, setName] = useState("");
  const [culture, setCulture] = useState("japanese");
  const [result, setResult] = useState<NameResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const convertName = async () => {
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const isLocal = window.location.hostname === "localhost";
      let data;

      if (isLocal) {
        const Groq = (await import("groq-sdk")).default;
        const groq = new Groq({
          apiKey: import.meta.env.VITE_LOCAL_GROQ_API_KEY,
          dangerouslyAllowBrowser: true,
        });

        const prompt = `
          Given this name: "${name.trim()}" and target culture: "${culture}", create a culturally appropriate version following these steps:
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
          - Elvish: Use Tengwar or Cirth scripts and romanization, focus on Sindarin or Quenya styles
          - Dragon: Use dragon-like sounds and syllables, consider Draconic language influences
          - Lord of the Rings: Consider names from Tolkien's works, Sindarin, Quenya, or Adûnaic
          - Dwarvish: Use Khuzdul or dwarven naming conventions, focus on strong, guttural sounds
          - Goblin: Use harsh, guttural sounds, short and sharp syllables
          - High Elven: Use Quenya-style names, focus on melodic and flowing sounds

          Return only a JSON object in this format without any extra text. Ensure that all string values are valid JSON by escaping any double quotes if necessary:
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
        console.log(
          "Raw Groq response:",
          completion.choices[0].message.content
        );
        let rawResponse = completion.choices[0].message.content;
        rawResponse = rawResponse.trim();
        // Remove any markdown code formatting (e.g., ``` or ```json)
        rawResponse = rawResponse.replace(/```/g, "").trim();
        data = JSON.parse(rawResponse);
      } else {
        const response = await fetch("/.netlify/functions/convert-name", {
          method: "POST",
          body: JSON.stringify({ name: name.trim(), culture }),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to convert name");
        }
        const rawData = await response.text();
        try {
          // Clean and parse the response
          const cleanedData = rawData
            .trim()
            // Remove any non-printable characters
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
            // Remove any markdown formatting
            .replace(/^```(?:json)?|```$/g, "")
            .trim();

          try {
            data = JSON.parse(cleanedData);
          } catch (jsonError) {
            console.error(
              "Initial JSON parse failed, attempting to clean further"
            );
            // Additional cleaning if initial parse fails
            const furtherCleanedData = cleanedData
              .replace(/\n/g, " ")
              .replace(/\r/g, "")
              .replace(/\t/g, " ")
              .replace(/\\"/g, '"')
              .replace(/\\/g, "\\\\")
              .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')
              .replace(/'/g, '"');

            data = JSON.parse(furtherCleanedData);
          }

          // Validate the structure
          if (!data.final_name || !data.original_name) {
            throw new Error("Invalid response structure");
          }
        } catch (parseError) {
          console.error("JSON parsing error:", parseError);
          console.log("Raw response:", rawData);
          throw new Error(`Invalid response format: ${parseError.message}`);
        }
      }

      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Failed to convert name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <Card className="p-6 backdrop-blur-sm bg-white/90 border-none shadow-xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Cultural Name Converter
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Enter your name to get its beautiful translation in different
            cultures
          </p>

          <div className="space-y-4">
            <Select value={culture} onValueChange={setCulture}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select culture" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.value} value={country.value}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="text-lg"
                onKeyPress={(e) => e.key === "Enter" && convertName()}
              />
              <Button
                onClick={convertName}
                disabled={loading}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Convert"
                )}
              </Button>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="text-center space-y-2">
                    <div className="text-4xl font-bold text-gray-900">
                      {result.final_name.native_script}
                    </div>
                    <div className="text-xl text-gray-600">
                      {result.final_name.pronunciation}
                    </div>
                    <div className="text-lg font-medium text-gray-800">
                      {result.final_name.romanized}
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <p>
                      <span className="font-medium">Original Name:</span>{" "}
                      {result.original_name}
                    </p>
                    <p>
                      <span className="font-medium">Name Meaning:</span>{" "}
                      {result.name_meaning}
                    </p>
                    <p>
                      <span className="font-medium">Cultural Translation:</span>{" "}
                      {result.cultural_translation}
                    </p>
                    <p>
                      <span className="font-medium">Meaning in English:</span>{" "}
                      {result.final_name.meaning_in_english}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Index;

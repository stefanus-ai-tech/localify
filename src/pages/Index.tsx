
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
  { value: "hebrew", label: "Hebrew" }
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

      const data = await response.json();
      setResult(data);
    } catch (err) {
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
            Enter your name to get its beautiful translation in different cultures
          </p>

          <div className="space-y-4">
            <Select
              value={culture}
              onValueChange={setCulture}
            >
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

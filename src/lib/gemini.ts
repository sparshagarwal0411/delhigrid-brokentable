/**
 * Gemini API for complaint analysis.
 * Gemini handles category, suggestion, AND ward from location.
 */

import { wards } from "@/data/wards";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODELS = ["gemini-2.5-flash"] as const;

export type ComplaintCategory =
  | "air"
  | "water"
  | "noise"
  | "transport"
  | "soil"
  | "land";

export interface GeminiAnalysis {
  category: ComplaintCategory;
  suggestion: string;
  wardId: number;
  wardName: string;
}

const CATEGORIES: ComplaintCategory[] = [
  "air",
  "water",
  "noise",
  "transport",
  "soil",
  "land",
];

// Compact area→ward_id for Gemini. 
// Note: This is an expanded sample as we have 250 wards now. 
// We should instruct Gemini to use the area name to find the best match ward index (1-250) based on its knowledge of Delhi.
const WARD_MAP_INSTRUCTION = "I have 250 wards in Delhi. The wards are named after these major areas (repeating as Ward 1, Ward 2...): Narela, Bakhtawarpur, Alipur, Model Town, Sadar Bazar, Civil Lines, Karol Bagh, Rajouri Garden, Hari Nagar, Tilak Nagar, Janakpuri, Dwarka, Najafgarh, Palam, Delhi Cantt, Vasant Kunj, Mehrauli, Sangam Vihar, Greater Kailash, Defence Colony, Lajpat Nagar, Okhla, Tughlakabad, Badarpur, Sarita Vihar, Mayur Vihar, Preet Vihar, Laxmi Nagar, Shakarpur, Gandhi Nagar, Krishna Nagar, Vivek Vihar, Dilshad Garden, Seelampur, Jama Masjid, Chandni Chowk, Daryaganj, Paharganj, RK Puram, Sarojini Nagar, Connaught Place, India Gate, Lodhi Colony, Pitampura, Rohini, Shalimar Bagh, Wazirpur, Ashok Vihar, Mangolpuri, Sultanpuri. If as specific location like 'Rohini Sector 7' is given, pick the most relevant Rohini ward ID. Wards 1-250 are sequentially distributed.";

/**
 * Analyze complaint - Gemini does category, suggestion, and ward from location.
 */
export async function analyzeComplaint(
  description: string,
  imageBase64?: string,
  imageMimeType?: string,
  locationText?: string,
  fallbackWardId?: number
): Promise<GeminiAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env");
  }

  const parts: Record<string, unknown>[] = [];

  if (imageBase64 && imageMimeType) {
    parts.push({
      inline_data: {
        mime_type: imageMimeType,
        data: imageBase64,
      },
    });
  }

  const locationLine = locationText?.trim()
    ? `\nLocation: ${locationText.trim()} - Use this to pick the correct Delhi ward.`
    : fallbackWardId
      ? `\nNo location given - use ward_id ${fallbackWardId}.`
      : "\nNo location - use ward_id 1.";

  parts.push({
    text: `You are an environmental complaint advisor for Delhi. Analyze the complaint and location, then respond.

Respond with ONLY valid JSON (no markdown, no code blocks). Use single quotes inside strings if needed.

Format: {"category": "air|water|noise|transport|soil|land", "suggestion": "Your specific suggestion", "ward_id": <number>}

WARD SYSTEM INFO:
${WARD_MAP_INSTRUCTION}

RULES:
- category: air|water|noise|transport|soil|land (air=pollution/smoke, water=drainage/sewage, noise=construction/honking, transport=traffic/roads, soil=waste dumping, land=encroachment)
- suggestion: SPECIFIC advice - helplines (MCD 155304, DPCC), actions (visit ward office, edmc.gov.in), contacts. NOT generic. 2-4 sentences.
- ward_id: MUST BE A NUMBER BETWEEN 1 AND 250. Analyze the location (e.g., 'Rohini Sector 5') and map it to the most relevant ward ID based on the area names provided. If you are unsure, use ${fallbackWardId || 1}.
${locationLine}

Complaint:
${description}`,
  });

  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const res = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.status === 429) {
        let retrySec = 60;
        try {
          const data = await res.json();
          const retryInfo = data?.error?.details?.find((d: { retryDelay?: string }) => d.retryDelay);
          if (retryInfo?.retryDelay) retrySec = parseFloat(String(retryInfo.retryDelay).replace("s", "")) || 60;
        } catch { /* ignore */ }
        lastError = new Error(
          `Gemini API rate limit reached. Please wait ${Math.ceil(retrySec)} seconds and try again. Check quota at aistudio.google.com`
        );
        continue; // Try next model
      }

      if (!res.ok) {
        const err = await res.text();
        lastError = new Error(`Gemini API error: ${res.status} - ${err.slice(0, 200)}`);
        continue;
      }

      const data = await res.json();
      let text =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) {
        lastError = new Error("No response from Gemini");
        continue;
      }

      // Robust JSON extraction
      const jsonStr = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();

      let category: string;
      let suggestion: string;
      let wardId: number;

      try {
        const parsed = JSON.parse(jsonStr) as { category?: string; suggestion?: string; ward_id?: number };
        category = parsed.category?.toLowerCase() || "land";
        suggestion = parsed.suggestion?.trim() || "";
        wardId = Math.min(250, Math.max(1, Number(parsed.ward_id) || fallbackWardId || 1));
      } catch {
        const catMatch = jsonStr.match(/"category"\s*:\s*"([^"]+)"/);
        const sugMatch = jsonStr.match(/"suggestion"\s*:\s*"([\s\S]*?)"\s*[,}]/);
        const wardMatch = jsonStr.match(/"ward_id"\s*:\s*(\d+)/);
        category = catMatch?.[1]?.toLowerCase() || "land";
        suggestion = (sugMatch?.[1] || "").replace(/\\(.)/g, "$1").trim();
        wardId = wardMatch ? Math.min(250, Math.max(1, parseInt(wardMatch[1], 10))) : (fallbackWardId || 1);
      }

      const validCategory = CATEGORIES.includes(category as ComplaintCategory)
        ? (category as ComplaintCategory)
        : "land";

      if (!suggestion || suggestion.length < 10) {
        lastError = new Error("AI did not return a proper suggestion. Please try again.");
        continue;
      }

      const ward = wards.find((w) => w.id === wardId);
      const wardName = ward?.name || `Ward ${wardId}`;

      return {
        category: validCategory,
        suggestion,
        wardId,
        wardName,
      };
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError || new Error("Gemini API request failed");
}

export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}

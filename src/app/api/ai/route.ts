// FILE: src/app/api/ai/route.ts
import { NextRequest, NextResponse } from "next/server";

/* SEED PROMPT SPECIFICATION:
  You are ExecuBot: produce JSON only. Given user problem: {user_input}, produce:
  {
    "pros":[{"id":"p1","text":"...","confidence":0.72}, ...],
    "cons":[{"id":"c1","text":"...","confidence":0.81}, ...],
    "notes":"short explanation of reasoning",
    "warnings":["possible_bias:always", "input_appears_unstructured"],
    "score": 85,
    "forecast": "Positive trajectory expected"
  }
  Return strict JSON only, no explanatory text. If you cannot answer, return an empty pros/cons arrays and a short notes string.
*/

// Mock Data for fallback
const MOCK_AI_RESPONSE = {
  pros: [
    {
      id: "p1",
      text: "High strategic alignment with Q3 goals",
      confidence: 0.88,
    },
    {
      id: "p2",
      text: "Cost efficiencies detected in supply chain",
      confidence: 0.75,
    },
  ],
  cons: [
    {
      id: "c1",
      text: "Implementation requires significant retraining",
      confidence: 0.92,
    },
    { id: "c2", text: "Short-term liquidity impact", confidence: 0.65 },
  ],
  notes:
    "Analysis indicates a net-positive outcome despite initial friction. Recommendation leans towards approval.",
  warnings: ["input_simulated", "check_liquidity_ratios"],
  score: 78,
  forecast: "Moderate Growth",
};

export async function POST(req: NextRequest) {
  const { prompt, mode } = await req.json();

  const apiKey = process.env.OPENAI_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Try OpenAI first if API key is available
  if (apiKey && apiKey.length > 5) {
    try {
      const systemPrompt = `You are ExecuBot, an AI business decision analysis assistant. Analyze the given business decision or problem and provide a structured JSON response with:
- pros: Array of advantages with id, text, and confidence (0-1)
- cons: Array of concerns with id, text, and confidence (0-1)
- notes: Brief explanation of your reasoning
- warnings: Array of potential issues or biases
- score: Overall profit/benefit score (0-100)
- forecast: Short forecast statement

Return ONLY valid JSON, no markdown, no code blocks, no explanatory text.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Using more cost-effective model
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Industry: ${mode || "General"}. Business Decision/Problem: ${prompt}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No content in OpenAI response");
      }

      const parsed = JSON.parse(content);

      // Validate structure
      if (
        !Array.isArray(parsed.pros) ||
        !Array.isArray(parsed.cons) ||
        typeof parsed.notes !== "string" ||
        !Array.isArray(parsed.warnings) ||
        typeof parsed.score !== "number" ||
        typeof parsed.forecast !== "string"
      ) {
        throw new Error("Invalid response structure from OpenAI");
      }

      return NextResponse.json(parsed);
    } catch (e) {
      console.error("OpenAI Error:", e);
      // Fall through to Gemini or mock
    }
  }

  // Try Gemini if API key is available
  if (geminiApiKey && geminiApiKey.length > 5) {
    try {
      const systemPrompt = `You are ExecuBot, an AI business decision analysis assistant. Analyze the given business decision or problem and provide a structured JSON response with:
- pros: Array of advantages with id, text, and confidence (0-1)
- cons: Array of concerns with id, text, and confidence (0-1)
- notes: Brief explanation of your reasoning
- warnings: Array of potential issues or biases
- score: Overall profit/benefit score (0-100)
- forecast: Short forecast statement

Return ONLY valid JSON, no markdown, no code blocks, no explanatory text.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `${systemPrompt}\n\nIndustry: ${mode || "General"}. Business Decision/Problem: ${prompt}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error("No content in Gemini response");
      }

      // Extract JSON from response (Gemini might wrap it)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in Gemini response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (
        !Array.isArray(parsed.pros) ||
        !Array.isArray(parsed.cons) ||
        typeof parsed.notes !== "string" ||
        !Array.isArray(parsed.warnings) ||
        typeof parsed.score !== "number" ||
        typeof parsed.forecast !== "string"
      ) {
        throw new Error("Invalid response structure from Gemini");
      }

      return NextResponse.json(parsed);
    } catch (e) {
      console.error("Gemini Error:", e);
      // Fall through to mock
    }
  }

  // Fallback to mock data if no API keys or if APIs fail
  // Simulate network delay for "Thinking" UI
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Enhance mock data based on prompt
  const enhancedMock = {
    ...MOCK_AI_RESPONSE,
    notes: `Analysis for ${mode || "General"} industry: ${prompt.substring(0, 100)}... The decision shows potential but requires careful consideration of the factors outlined above.`,
  };

  return NextResponse.json(enhancedMock);
}

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { image, mimeType } = await request.json();

    if (!image) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: image,
        },
      },
      {
        text: `You are a product identification expert. Analyze this image and identify the product shown.

Return a JSON object with these fields:
- "name": the product name (be specific, include brand if visible)
- "category": product category (e.g., "furniture", "clothing", "electronics", "accessories")
- "description": a brief description including material, style, color, and any distinguishing features
- "brand": the brand if identifiable, otherwise "Unknown"
- "searchQuery": a concise search query optimized for finding this exact product or very similar ones to purchase online (include brand, product type, color, material)

Return ONLY the JSON object, no markdown formatting or code blocks. Be conservative. If unsure about brand, return null.
`,
      },
    ]);

    const responseText = result.response.text();

    let productInfo;
    try {
      // Strip markdown code fences, trailing commas before }, and whitespace
      const cleaned = responseText
        .replace(/```json\n?|\n?```/g, "")
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .trim();
      // Extract the JSON object from the response in case there's extra text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      productInfo = JSON.parse(jsonMatch[0]);
    } catch {
      productInfo = {
        name: "Unknown Product",
        category: "Unknown",
        description: responseText,
        brand: "Unknown",
        searchQuery: responseText.slice(0, 100),
      };
    }

    return Response.json(productInfo);
  } catch (error) {
    console.error("Gemini API error:", error);
    return Response.json(
      { error: "Failed to identify product" },
      { status: 500 }
    );
  }
}

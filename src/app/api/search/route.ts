export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return Response.json({ error: "No search query provided" }, { status: 400 });
    }

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `buy ${query} online price`,
        search_depth: "basic",
        include_domains: [
          "amazon.com",
          "amazon.co.uk",
          "zappos.com",
          "walmart.com",
          "target.com",
          "ebay.com",
          "etsy.com",
          "wayfair.com",
          "wayfair.co.uk",
          "ikea.com",
          "nordstrom.com",
          "bestbuy.com",
        ],
        max_results: 5,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status}`);
    }

    const data = await response.json();

    const products = data.results.map(
      (result: { title: string; url: string; content: string }) => {
        const priceMatch = result.content.match(
          /\$[\d,]+\.?\d{0,2}/
        );

        return {
          title: result.title,
          url: result.url,
          snippet: result.content.slice(0, 200),
          price: priceMatch ? priceMatch[0] : null,
          source: new URL(result.url).hostname.replace("www.", ""),
        };
      }
    );

    return Response.json({ products });
  } catch (error) {
    console.error("Tavily API error:", error);
    return Response.json(
      { error: "Failed to search for products" },
      { status: 500 }
    );
  }
}

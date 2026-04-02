import { saveSearch, getSearchHistory } from "@/lib/db";

export async function GET() {
  try {
    const history = getSearchHistory(20);

    return Response.json(history);
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return Response.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const id = saveSearch({
      image: body.image,
      mimeType: body.mimeType,
      productName: body.productName,
      productCategory: body.productCategory,
      productDescription: body.productDescription,
      productBrand: body.productBrand,
      searchQuery: body.searchQuery,
      results: body.results || [],
    });

    return Response.json({ id });
  } catch (error) {
    console.error("Failed to save search:", error);
    return Response.json({ error: "Failed to save search" }, { status: 500 });
  }
}

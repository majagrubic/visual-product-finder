import { getSearchById } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const search = getSearchById(Number(id));

    if (!search) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(search);
  } catch (error) {
    console.error("Failed to fetch search:", error);
    return Response.json({ error: "Failed to fetch search" }, { status: 500 });
  }
}

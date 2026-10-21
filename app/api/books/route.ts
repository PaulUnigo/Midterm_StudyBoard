import { NextResponse } from "next/server";
import { z } from "zod";
import axios from "axios";
import { searchBooks } from "@/lib/openLibrary";

const searchQuerySchema = z.object({
  q: z.string().trim().min(1, "A search query is required").max(200),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = searchQuerySchema.safeParse({ q: searchParams.get("q") });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await searchBooks(parsed.data.q));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("Open Library request failed:", error.message);
      return NextResponse.json(
        { error: "Book search is temporarily unavailable. Please try again later." },
        { status: 502 },
      );
    }
    throw error;
  }
}
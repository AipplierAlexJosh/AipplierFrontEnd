import { NextRequest, NextResponse } from "next/server";

type ResultsPayload = {
  jobId: string;
  resumePdfB64: string;
  coverLetterPdfB64: string;
  applyUrl?: string;
};

let latestResults: ResultsPayload | null = null;

export async function GET() {
  if (!latestResults) {
    return new NextResponse(null, { status: 204 });
  }
  return NextResponse.json(latestResults);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResultsPayload;
    latestResults = body;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE() {
  latestResults = null;
  return NextResponse.json({ ok: true });
}


import { NextRequest, NextResponse } from "next/server";

type ProgressEntry = {
  message: string;
  stage: string;
  timestamp: string;
};

const progressStore: ProgressEntry[] = [];

export async function GET() {
  return NextResponse.json(progressStore);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProgressEntry;
    progressStore.push(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}

export async function DELETE() {
  progressStore.length = 0;
  return NextResponse.json({ ok: true });
}


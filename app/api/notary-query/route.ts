// app/api/notary-query/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const query: string = body?.query;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // minimal working response (replace later with real logic)
    return NextResponse.json({
      answer: `Test response: ${query}`,
      sources: [],
    });
  } catch (err: any) {
    console.error('API ERROR:', err);

    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}

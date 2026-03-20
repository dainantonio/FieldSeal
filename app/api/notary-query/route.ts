// app/api/notary-query/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const states = searchParams.get('states');
    const overrideUrl = searchParams.get('overrideUrl');

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // minimal working response (replace later with real logic)
    return NextResponse.json({
      answer: `Test response for query: "${query}"${states ? ` in states: ${states}` : ''}${overrideUrl ? ` with override URL: ${overrideUrl}` : ''}`,
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

// Also keep POST for compatibility if needed, but update it to match the logic
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

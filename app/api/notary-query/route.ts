// app/api/notary-query/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { buildNotaryPrompt } from '@/lib/notaryPrompt';

// Configure this route as dynamic (not static)
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const statesParam = searchParams.get('states');
    const overrideUrl = searchParams.get('overrideUrl');

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Parse states from comma-separated string
    const selectedStates = statesParam ? statesParam.split(',').filter(s => s.trim()) : [];

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'API configuration error: GEMINI_API_KEY not set' },
        { status: 500 }
      );
    }

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Build the prompt with context
    const userPrompt = buildNotaryPrompt({
      query,
      selectedStates,
      overrideUrl: overrideUrl || undefined,
    });

    // Call Gemini API using the models.generateContent method
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
    });

    const answer = response.text;

    if (!answer) {
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      );
    }

    // Extract sources from the response
    const sources = extractSources(answer, selectedStates);

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (err: any) {
    console.error('API ERROR:', err);

    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}

// Also keep POST for compatibility if needed
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = body?.query;
    const selectedStates: string[] = body?.states || [];
    const overrideUrl: string = body?.overrideUrl;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'API configuration error: GEMINI_API_KEY not set' },
        { status: 500 }
      );
    }

    // Initialize Gemini client
    const ai = new GoogleGenAI({ apiKey });

    // Build the prompt with context
    const userPrompt = buildNotaryPrompt({
      query,
      selectedStates,
      overrideUrl: overrideUrl || undefined,
    });

    // Call Gemini API using the models.generateContent method
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userPrompt,
    });

    const answer = response.text;

    if (!answer) {
      return NextResponse.json(
        { error: 'Failed to generate response' },
        { status: 500 }
      );
    }

    // Extract sources from the response
    const sources = extractSources(answer, selectedStates);

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (err: any) {
    console.error('API ERROR:', err);

    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract sources from the answer text
 * Looks for statute citations and official sources mentioned in the response
 */
function extractSources(
  answer: string,
  selectedStates: string[]
): Array<{ title: string; uri: string }> {
  const sources: Array<{ title: string; uri: string }> = [];

  // Pattern to match statute citations (e.g., "N.Y. Gen. Oblig. Law § 135", "Cal. Notary Public Law § 8200")
  const statutePattern = /([A-Z][a-z]*\.?\s*(?:Gen\.|Notary|Code|Law|Stat\.|Rev\.|Comp\.|Civ\.|Bus\.)[\w\s.§]*)/g;
  const matches = answer.match(statutePattern);

  if (matches) {
    matches.forEach(match => {
      // Avoid duplicates
      if (!sources.some(s => s.title === match)) {
        sources.push({
          title: match.trim(),
          uri: `https://www.google.com/search?q=${encodeURIComponent(match + ' statute')}`,
        });
      }
    });
  }

  // Add state-specific resources if states are selected
  selectedStates.forEach(state => {
    const stateResources = getStateResources(state);
    sources.push(...stateResources);
  });

  return sources;
}

/**
 * Get official state resources for notary laws
 */
function getStateResources(state: string): Array<{ title: string; uri: string }> {
  const stateResourceMap: Record<string, Array<{ title: string; uri: string }>> = {
    'California': [
      {
        title: 'California Notary Public Law',
        uri: 'https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?lawCode=GOV&division=3.&title=&part=&chapter=22.5.&article=',
      },
    ],
    'Texas': [
      {
        title: 'Texas Notary Public Law',
        uri: 'https://statutes.capitol.texas.gov/Docs/GOV/htm/GOV.406.htm',
      },
    ],
    'New York': [
      {
        title: 'New York General Obligations Law - Notaries Public',
        uri: 'https://www.dos.ny.gov/licensing-services/notary-public',
      },
    ],
    'Florida': [
      {
        title: 'Florida Notary Public Law',
        uri: 'https://www.flsenate.gov/Laws/Statutes/2023/Chapter117',
      },
    ],
    'Ohio': [
      {
        title: 'Ohio Notary Public Law',
        uri: 'https://codes.ohio.gov/ohio-revised-code/chapter-147',
      },
    ],
  };

  return stateResourceMap[state] || [];
}

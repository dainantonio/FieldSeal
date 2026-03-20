import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { buildNotaryPrompt, FIELD_ASSIST_SYSTEM_INSTRUCTION } from '@/lib/notaryPrompt';

export async function POST(request: NextRequest) {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (!geminiApiKey) {
    return NextResponse.json(
      { error: 'Server configuration error: GEMINI_API_KEY is not set.' },
      { status: 500 },
    );
  }

  try {
    const {
      query,
      selectedStates = [],
      overrideUrl = '',
    }: {
      query?: string;
      selectedStates?: string[];
      overrideUrl?: string;
    } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: buildNotaryPrompt({
                query,
                selectedStates,
                overrideUrl,
              }),
            },
          ],
        },
      ],
      config: {
        tools: [
          { googleSearch: {} },
          ...(overrideUrl ? [{ urlContext: {} }] : []),
        ],
        systemInstruction: FIELD_ASSIST_SYSTEM_INSTRUCTION,
      },
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = chunks
      .filter((chunk) => chunk.web?.uri && chunk.web?.title)
      .map((chunk) => ({
        uri: chunk.web!.uri as string,
        title: chunk.web!.title as string,
      }));

    return NextResponse.json({
      answer: response.text || 'No answer generated.',
      sources,
    });
  } catch (error) {
    console.error('Failed to generate notary answer', error);
    return NextResponse.json(
      { error: 'Failed to retrieve answer. Please try again.' },
      { status: 500 },
    );
  }
}

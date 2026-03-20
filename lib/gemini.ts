import { GoogleGenAI } from '@google/genai';
import { buildNotaryPrompt } from './notaryPrompt';

export async function queryGemini({
  query,
  selectedStates,
  overrideUrl,
  apiKey,
}: {
  query: string;
  selectedStates: string[];
  overrideUrl?: string;
  apiKey: string;
}) {
  const ai = new GoogleGenAI({ apiKey });
  const userPrompt = buildNotaryPrompt({
    query,
    selectedStates,
    overrideUrl,
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
  });

  const answer = response.text;
  if (!answer) {
    throw new Error('Failed to generate response');
  }

  return {
    answer,
    sources: extractSources(answer, selectedStates),
  };
}

function extractSources(
  answer: string,
  selectedStates: string[]
): Array<{ title: string; uri: string }> {
  const sources: Array<{ title: string; uri: string }> = [];
  const statutePattern = /([A-Z][a-z]*\.?\s*(?:Gen\.|Notary|Code|Law|Stat\.|Rev\.|Comp\.|Civ\.|Bus\.)[\w\s.§]*)/g;
  const matches = answer.match(statutePattern);

  if (matches) {
    matches.forEach(match => {
      if (!sources.some(s => s.title === match)) {
        sources.push({
          title: match.trim(),
          uri: `https://www.google.com/search?q=${encodeURIComponent(match + ' statute')}`,
        });
      }
    });
  }

  selectedStates.forEach(state => {
    const stateResources = getStateResources(state);
    sources.push(...stateResources);
  });

  return sources;
}

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

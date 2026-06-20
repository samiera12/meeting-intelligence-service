import axios from 'axios';
import { config } from '../config';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';
import { TranscriptEntry, AnalysisResult, AnalysisItem } from '../types/meeting';

export async function analyzeMeeting(
  transcript: TranscriptEntry[],
  traceId: string
): Promise<AnalysisResult> {
  const formattedTranscript = transcript
    .map((t) => `[${t.timestamp}] ${t.speaker}: ${t.text}`)
    .join('\n');

  const validTimestamps = new Set(transcript.map((t) => t.timestamp));

  const prompt = `You are a meeting analysis assistant. Analyze the meeting transcript below and extract structured information.

CRITICAL RULES:
1. ONLY use information EXPLICITLY stated in the transcript. Do not infer, assume, or add anything not directly said.
2. Every item MUST include at least one citation referencing the exact [timestamp] from the transcript.
3. If you cannot find evidence for something, do NOT include it.
4. Return ONLY valid JSON. No preamble, no explanation, no markdown code blocks, no backticks.

Output this exact JSON structure:
{
  "summary": [{ "text": "...", "citations": [{ "timestamp": "MM:SS" }] }],
  "actionItems": [{ "task": "...", "assignee": "name or null", "citations": [{ "timestamp": "MM:SS" }] }],
  "decisions": [{ "text": "...", "citations": [{ "timestamp": "MM:SS" }] }],
  "followUps": [{ "text": "...", "citations": [{ "timestamp": "MM:SS" }] }]
}

TRANSCRIPT:
${formattedTranscript}

Cite only timestamps that appear above. Return only JSON, nothing else.`;

  logger.info('Calling Gemini API for meeting analysis', { traceId });

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + config.gemini.apiKey;

  let responseText: string;
  try {
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      },
      {
        headers: { 'content-type': 'application/json' },
        timeout: 30000,
      }
    );
    responseText = response.data.candidates[0].content.parts[0].text;
  } catch (err: any) {
    logger.error('Gemini API error', {
      traceId,
      error: err.response?.data || err.message,
    });
    throw new AppError('AI analysis service unavailable', 503, 'AI_SERVICE_ERROR');
  }

  let parsed: AnalysisResult;
  try {
    const clean = responseText.replace(/```json\n?|```\n?/g, '').trim();
    parsed = JSON.parse(clean);
  } catch (err) {
    logger.error('Failed to parse Gemini response as JSON', { traceId, responseText });
    throw new AppError('AI returned malformed response', 500, 'AI_PARSE_ERROR');
  }

  const validateCitations = (items: AnalysisItem[] | undefined): AnalysisItem[] =>
    (items || []).map((item) => ({
      ...item,
      citations: (item.citations || []).filter((c) => {
        const valid = validTimestamps.has(c.timestamp);
        if (!valid) {
          logger.warn('AI cited invalid timestamp — removing', { traceId, timestamp: c.timestamp });
        }
        return valid;
      }),
    }));

  return {
    summary: validateCitations(parsed.summary),
    actionItems: validateCitations(parsed.actionItems),
    decisions: validateCitations(parsed.decisions),
    followUps: validateCitations(parsed.followUps),
  };
}
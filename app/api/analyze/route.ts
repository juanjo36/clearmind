import { Groq } from 'groq-sdk';
import { parseGroqResponse } from '@/lib/groq-parser';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const BRAIN_DUMP_PROMPT = (input: string) => `You are a productivity coach that transforms chaotic thoughts into clear action.

User's brain dump (unstructured thoughts):
${input}

IMPORTANT: Respond EXACTLY in this format. Use these exact emojis and sections:

📌 Summary:
[1-2 sentences about their mental state]

⚠️ Problems:
[List 2-4 main blockers/issues, one per line, starting with dash]

🎯 Priorities (ranked 1-5):
[List items ONLY with format: "NUMBER. [item description] (URGENCY/5) - reason"]

🚀 3 Actions for TODAY:
[List items ONLY with format: "NUMBER. [action] - time needed"]

Be concise, practical, and actionable.`;

export async function POST(request: Request) {
  try {
    const { input } = await request.json();

    if (!input || input.trim().length === 0) {
      return Response.json(
        { error: 'Please provide input' },
        { status: 400 }
      );
    }

    const prompt = BRAIN_DUMP_PROMPT(input);

    const message = await groq.chat.completions.create({
      messages: [{
        role: 'user',
        content: prompt,
      }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const result = message.choices[0].message.content || '';
    const parsed = parseGroqResponse(result);
    return Response.json({ result, parsed });
  } catch (error) {
    console.error('Groq API error:', error);
    return Response.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

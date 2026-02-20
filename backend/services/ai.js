import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';

export function isConfigured() {
  return !!apiKey.trim();
}

/**
 * Generate a personalized planner from syllabi and assignments using AI.
 * Returns an array of planner items: { title, due_date, course_name, type, notes }
 */
export async function generatePlanner({ courses, syllabi, assignments, term }) {
  if (!isConfigured()) {
    return { error: 'OpenAI API key not configured. Add OPENAI_API_KEY to backend/.env' };
  }

  const client = new OpenAI({ apiKey });

  const context = JSON.stringify({
    term: term?.name || 'Current term',
    termStart: term?.start_date,
    termEnd: term?.end_date,
    courses: courses?.map((c) => ({ id: c.id, name: c.name, course_number: c.course_number })) || [],
    syllabi: syllabi || {},
    assignments: assignments?.map((a) => ({
      title: a.title,
      course_name: a.course_name,
      due_at: a.due_at,
      points_possible: a.points_possible,
    })) || [],
  }, null, 2);

  const systemPrompt = `You are an academic planning assistant. Given a student's courses, syllabi, and assignments from Populi, create a smart study planner.

Output a JSON array of planner items. Each item must have:
- title: string (what to do, e.g. "Study for Quiz 1" or "Complete Essay Draft 1")
- due_date: YYYY-MM-DD or null if no specific date
- course_name: string or null for general items
- type: "assignment" | "study" | "exam_prep" | "reading" | "other"
- notes: string (optional tips or breakdown, e.g. "Review ch 1-3, practice problems")

Include:
1. All assignments with their due dates (type: "assignment")
2. Study blocks 2-5 days before quizzes/exams (type: "study" or "exam_prep")
3. Reading/prep tasks from syllabi schedules when helpful (type: "reading")
4. Suggested milestones for large projects (break into 2-3 steps)

Return ONLY valid JSON: an array of objects. No markdown, no explanation outside the array.`;

  const userPrompt = `Create a planner from this data:\n\n${context}`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '';
    // Strip markdown code blocks if present
    const jsonStr = content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    const items = JSON.parse(jsonStr);

    if (!Array.isArray(items)) {
      return { error: 'AI returned invalid format' };
    }

    return { items };
  } catch (err) {
    console.error('AI planner error:', err);
    if (err?.status === 401) {
      return { error: 'Invalid OpenAI API key' };
    }
    if (err?.code === 'insufficient_quota') {
      return { error: 'OpenAI API quota exceeded' };
    }
    return { error: err?.message || 'AI request failed' };
  }
}

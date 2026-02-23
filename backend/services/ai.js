import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || '';

export function isConfigured() {
  return !!apiKey.trim();
}

/** Verify the OpenAI API key works with a minimal request. */
export async function verifyApiKey() {
  if (!isConfigured()) {
    return { ok: false, error: 'OPENAI_API_KEY not set in backend/.env' };
  }
  try {
    const client = new OpenAI({ apiKey });
    await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Reply with only: OK' }],
      max_tokens: 10,
    });
    return { ok: true };
  } catch (err) {
    if (err?.status === 401) return { ok: false, error: 'Invalid API key' };
    if (err?.code === 'insufficient_quota') return { ok: false, error: 'API quota exceeded' };
    return { ok: false, error: err?.message || 'OpenAI API request failed' };
  }
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

/**
 * Generate planner from locally stored syllabi and assignments (no Populi).
 * classes: [{ id, name }], syllabi: { [classId]: { title, content } }, assignments: [{ classId, name, dueDate, course_name }]
 */
export async function generatePlannerFromLocalData({ classes = [], syllabi = {}, assignments = [] }) {
  if (!isConfigured()) {
    return { error: 'OpenAI API key not configured. Add OPENAI_API_KEY to backend/.env' };
  }

  const client = new OpenAI({ apiKey });

  const context = JSON.stringify({
    courses: classes.map((c) => ({ id: c.id, name: c.name })),
    syllabi: syllabi,
    assignments: assignments.map((a) => ({
      title: a.name,
      course_name: a.course_name,
      due_at: a.dueDate || a.due_date,
    })),
  }, null, 2);

  const systemPrompt = `You are an academic planning assistant. Given a student's classes, syllabi (syllabus content per class), and assignments, create a smart study planner.

Extract from the syllabi: due dates, exam dates, project milestones, reading schedules, quiz dates, and any other important deadlines or tasks. Combine with the provided assignments to build a complete planner.

Output a JSON array of planner items. Each item must have:
- title: string (what to do, e.g. "Study for Quiz 1" or "Read Chapter 5")
- due_date: YYYY-MM-DD or null if no specific date (use assignments' due dates when available; infer from syllabus text when possible)
- course_name: string or null for general items
- type: "assignment" | "study" | "exam_prep" | "reading" | "other"
- notes: string (optional tips, e.g. "Review ch 1-3")

Include:
1. All assignments with their due dates (type: "assignment")
2. Exams, quizzes, projects mentioned in syllabi (type: "assignment" or "exam_prep")
3. Study blocks before exams (type: "study" or "exam_prep")
4. Reading and prep tasks from syllabi schedules (type: "reading")
5. Suggested milestones for large projects (break into 2-3 steps)

Return ONLY valid JSON: an array of objects. No markdown, no explanation outside the array.`;

  const userPrompt = `Create a planner from this syllabus and assignment data:\n\n${context}`;

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

/**
 * Generate planner from extracted PDF syllabus text.
 * syllabi: [{ courseName: string, text: string }] - one per uploaded PDF
 */
export async function generatePlannerFromPdfText(syllabi) {
  if (!isConfigured()) {
    return { error: 'OpenAI API key not configured. Add OPENAI_API_KEY to backend/.env' };
  }
  if (!syllabi?.length || !syllabi.some((s) => s.text?.trim())) {
    return { error: 'No syllabus text to process' };
  }

  const client = new OpenAI({ apiKey });

  const context = syllabi.map((s) => ({
    courseName: s.courseName || 'Unknown',
    text: (s.text || '').slice(0, 50000),
  }));

  const systemPrompt = `You are an academic planning assistant. You receive syllabus text extracted from PDF files. Extract ALL assignments, exams, quizzes, projects, reading due dates, and other deadlines. Create a complete calendar of items.

Output a JSON array of planner items. Each item must have:
- title: string (e.g. "Essay 1 due", "Midterm Exam", "Read Chapter 5")
- due_date: YYYY-MM-DD (infer the year from context—use current academic year if not stated; use null only if no date can be inferred)
- course_name: string (from the syllabus/course name)
- type: "assignment" | "study" | "exam_prep" | "reading" | "other"
- notes: string (optional, e.g. "Worth 20% of grade")

Extract every assignment and deadline you can find. For dates like "Oct 15" or "March 3", use the current or next academic year. Be thorough—include all homework, papers, exams, quizzes, readings, and project milestones.

Return ONLY valid JSON: an array of objects. No markdown, no explanation outside the array.`;

  const userPrompt = `Extract all assignments and deadlines from these syllabus texts and create a planner:\n\n${JSON.stringify(context, null, 2)}`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '';
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

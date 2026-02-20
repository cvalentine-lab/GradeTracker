const API = '/api';

async function fetchJson(url, opts = {}) {
  const res = await fetch(`${API}${url}`, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const populi = {
  status: () => fetchJson('/populi/status'),
  term: () => fetchJson('/populi/term'),
  courses: (termId) => fetchJson(`/populi/courses/${termId || ''}`),
  grades: (termId) => fetchJson(`/populi/grades/${termId || ''}`),
  assignments: (courseId) => fetchJson(`/populi/assignments/${courseId || ''}`),
  syllabus: (courseId) => fetchJson(`/populi/syllabus/${courseId}`),
};

export const planner = {
  list: () => fetchJson('/planner'),
  build: (termId) => fetchJson(`/planner/build${termId ? `?term_id=${termId}` : ''}`),
  aiBuild: () => fetchJson('/planner/ai-build', { method: 'POST' }),
  add: (body) => fetchJson('/planner', { method: 'POST', body: JSON.stringify(body) }),
  toggleComplete: (id) => fetchJson(`/planner/${id}/complete`, { method: 'PATCH' }),
  delete: (id) => fetchJson(`/planner/${id}`, { method: 'DELETE' }),
};

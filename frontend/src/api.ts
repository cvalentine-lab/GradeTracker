const API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchJson<T>(url: string, opts: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${url}`, {
      headers: getHeaders(),
      ...opts,
    });
  } catch (err) {
    throw new Error('Cannot reach server. Is the backend running?');
  }
  const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: Array<{ msg?: string }> };
  if (!res.ok) {
    const msg = data.error ?? data.errors?.[0]?.msg ?? res.statusText;
    throw new Error(msg || 'Request failed');
  }
  return data as T;
}

export interface User {
  id: string;
  email: string;
}

export interface Class {
  id: string;
  userId: string;
  name: string;
  assignments: Assignment[];
}

export interface Assignment {
  id: string;
  classId: string;
  name: string;
  weightPercent: number;
  gradeReceived: number | null;
  dueDate: string;
}

export const auth = {
  register: (email: string, password: string) =>
    fetchJson<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    fetchJson<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

export const classes = {
  list: () => fetchJson<Class[]>('/classes'),
  create: (name: string) =>
    fetchJson<Class>('/classes', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
  update: (id: string, name: string) =>
    fetchJson<Class>(`/classes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),
  delete: (id: string) =>
    fetch(`${API}/classes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then((r) => {
      if (!r.ok) return r.json().then((d) => { throw new Error((d as { error?: string }).error); });
    }),
};

export const assignments = {
  listByClass: (classId: string) =>
    fetchJson<Assignment[]>(`/assignments/class/${classId}`),
  create: (data: {
    classId: string;
    name: string;
    weightPercent: number;
    gradeReceived?: number | null;
    dueDate: string;
  }) =>
    fetchJson<Assignment>('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<{ name: string; weightPercent: number; gradeReceived: number | null; dueDate: string }>) =>
    fetchJson<Assignment>(`/assignments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    fetch(`${API}/assignments/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then((r) => {
      if (!r.ok) return r.json().then((d) => { throw new Error((d as { error?: string }).error); });
    }),
};

export interface Syllabus {
  id: string;
  classId: string;
  title: string;
  content: string;
  createdAt: string;
}

export const syllabi = {
  get: (classId: string) =>
    fetchJson<{ syllabus: Syllabus | null }>(`/syllabi/class/${classId}`),
  upload: (classId: string, title: string, content: string) =>
    fetchJson<{ syllabus: Syllabus }>('/syllabi', {
      method: 'POST',
      body: JSON.stringify({ classId, title, content }),
    }),
  delete: (id: string) =>
    fetch(`${API}/syllabi/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then((r) => {
      if (!r.ok) return r.json().then((d) => { throw new Error((d as { error?: string }).error); });
    }),
};

export const grades = {
  currentGrade: (classId: string) =>
    fetchJson<{ currentGrade: number | null; classId: string }>(`/grades/class/${classId}/current`),
  minNeeded: (classId: string, target: number = 90) =>
    fetchJson<{
      minNeeded: number | null;
      message: string;
      targetGrade: number;
      classId: string;
    }>(`/grades/class/${classId}/min-needed?target=${target}`),
  priority: (classId: string) =>
    fetchJson<(Assignment & { priorityScore: number })[]>(`/grades/class/${classId}/priority`),
};

export interface PlannerItem {
  id: number;
  title: string;
  due_date: string | null;
  course_name: string | null;
  type: string;
  notes: string | null;
  completed: number;
}

export const planner = {
  list: () => fetchJson<{ planner: PlannerItem[] }>('/planner'),
  build: () => fetchJson<{ planner: PlannerItem[] }>('/planner/build'),
  aiBuildFromSyllabi: () =>
    fetchJson<{ planner: PlannerItem[] }>('/planner/ai-build-from-syllabi', { method: 'POST' }),
  aiBuildFromPdf: (pdfs: { name: string; base64: string }[]) =>
    fetchJson<{ planner: PlannerItem[] }>('/planner/ai-build-from-pdf', {
      method: 'POST',
      body: JSON.stringify({ pdfs }),
    }),
  add: (data: { title: string; due_date?: string | null }) =>
    fetchJson<{ item: PlannerItem }>('/planner', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleComplete: (id: number) =>
    fetchJson<{ item: PlannerItem }>(`/planner/${id}/complete`, { method: 'PATCH' }),
  delete: (id: number) =>
    fetch(`${API}/planner/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    }).then((r) => {
      if (!r.ok) return r.json().then((d) => { throw new Error((d as { error?: string }).error); });
    }),
};

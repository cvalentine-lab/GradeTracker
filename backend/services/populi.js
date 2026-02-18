import fetch from 'node-fetch';

const API_URL = process.env.POPULI_API_URL?.replace(/\/$/, '') || '';
const ACCESS_TOKEN = process.env.POPULI_ACCESS_TOKEN || '';

export function isConfigured() {
  return !!(API_URL && ACCESS_TOKEN);
}

async function populiRequest(path, params = {}) {
  if (!isConfigured()) {
    return { error: 'Populi API not configured. Add POPULI_API_URL and POPULI_ACCESS_TOKEN to .env' };
  }
  const url = new URL(`${API_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    return { error: `Populi API error: ${res.status} ${res.statusText}` };
  }
  return res.json();
}

export async function getCurrentTerm() {
  const data = await populiRequest('/academic_terms/current');
  return data.error ? data : { term: data };
}

export async function getCourseOfferings(termId) {
  const data = await populiRequest('/academic_terms/courseofferings', { id: termId });
  return data.error ? data : { courses: Array.isArray(data) ? data : (data.courseofferings || []) };
}

export async function getCourseOffering(id) {
  const data = await populiRequest(`/course_offerings/${id}`);
  return data.error ? data : { course: data };
}

export async function getCourseSyllabus(courseOfferingId) {
  const data = await populiRequest(`/course_offerings/${courseOfferingId}/syllabus`);
  return data.error ? data : { syllabus: data };
}

export async function getAssignments(courseOfferingId) {
  const data = await populiRequest('/assignments', { course_offering_id: courseOfferingId });
  return data.error ? data : { assignments: Array.isArray(data) ? data : (data.assignments || []) };
}

export async function getAssignmentSubmissions(personId) {
  const data = await populiRequest('/assignment_submissions', { person_id: personId });
  return data.error ? data : { submissions: Array.isArray(data) ? data : (data.assignment_submissions || []) };
}

export async function getStudentEnrollments(personId, termId) {
  const data = await populiRequest('/students/enrollments', { person_id: personId, academic_term_id: termId });
  return data.error ? data : { enrollments: Array.isArray(data) ? data : (data.enrollments || []) };
}

export async function getPersonByStudentId(studentId) {
  const data = await populiRequest('/people/by_student_id', { student_id: studentId });
  return data.error ? data : { person: data };
}

export async function getEnrollmentGrades(enrollmentId) {
  const data = await populiRequest(`/enrollments/${enrollmentId}`);
  return data.error ? data : { enrollment: data };
}

export async function getStudentGradeReport(personId, termId) {
  const data = await populiRequest('/students/export_grade_report', { person_id: personId, academic_term_id: termId });
  return data.error ? data : { report: data };
}

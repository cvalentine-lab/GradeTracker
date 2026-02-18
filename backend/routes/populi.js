import express from 'express';
import * as populi from '../services/populi.js';
import {
  DEMO_TERM,
  DEMO_COURSES,
  DEMO_GRADES,
  DEMO_ASSIGNMENTS,
  DEMO_SYLLABI,
} from '../services/demoData.js';

const router = express.Router();

function useDemoData() {
  return !populi.isConfigured();
}

// Current academic term
router.get('/term', async (req, res) => {
  if (useDemoData()) {
    return res.json({ term: DEMO_TERM });
  }
  const result = await populi.getCurrentTerm();
  if (result.error) return res.status(500).json(result);
  res.json(result);
});

// Course offerings for term
router.get('/courses/:termId?', async (req, res) => {
  const { termId } = req.params;
  if (useDemoData()) {
    return res.json({ courses: DEMO_COURSES });
  }
  const tid = termId || (await populi.getCurrentTerm())?.term?.id;
  if (!tid) return res.status(400).json({ error: 'No term ID' });
  const result = await populi.getCourseOfferings(tid);
  if (result.error) return res.status(500).json(result);
  res.json(result);
});

// Grades (enrollments with grades) - demo uses mock grades
router.get('/grades/:termId?', async (req, res) => {
  if (useDemoData()) {
    return res.json({ grades: DEMO_GRADES });
  }
  // Real: need person_id and term_id - typically from session/auth
  const personId = req.query.person_id;
  const termId = req.params.termId || req.query.term_id;
  if (!personId || !termId) {
    return res.status(400).json({ error: 'person_id and term_id required' });
  }
  const enrollments = await populi.getStudentEnrollments(personId, termId);
  if (enrollments.error) return res.status(500).json(enrollments);
  // Map enrollments to grades
  const grades = (enrollments.enrollments || []).map((e) => ({
    course_id: e.course_offering_id,
    course_name: e.course_offering?.name || e.course_name,
    grade: e.final_grade,
    gpa: e.grade_point_value,
    letter_grade: e.final_grade,
  }));
  res.json({ grades });
});

// Assignments for a course or all courses
router.get('/assignments/:courseId?', async (req, res) => {
  const { courseId } = req.params;
  if (useDemoData()) {
    let assignments = DEMO_ASSIGNMENTS;
    if (courseId) {
      assignments = assignments.filter((a) => a.course_offering_id === courseId);
    }
    return res.json({ assignments });
  }
  if (!courseId) {
    return res.status(400).json({ error: 'course_offering_id required for live API' });
  }
  const result = await populi.getAssignments(courseId);
  if (result.error) return res.status(500).json(result);
  res.json(result);
});

// Syllabus for a course
router.get('/syllabus/:courseId', async (req, res) => {
  const { courseId } = req.params;
  if (useDemoData()) {
    const syllabus = DEMO_SYLLABI[courseId];
    if (!syllabus) return res.status(404).json({ error: 'Syllabus not found' });
    return res.json({ syllabus });
  }
  const result = await populi.getCourseSyllabus(courseId);
  if (result.error) return res.status(500).json(result);
  res.json(result);
});

// Status - whether using demo or live Populi
router.get('/status', (req, res) => {
  res.json({
    configured: populi.isConfigured(),
    mode: populi.isConfigured() ? 'live' : 'demo',
  });
});

export default router;

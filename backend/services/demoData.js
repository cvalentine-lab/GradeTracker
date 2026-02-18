const DEMO_TERM = {
  id: '12345',
  name: 'Fall 2024',
  start_date: '2024-08-26',
  end_date: '2024-12-20',
};

const DEMO_COURSES = [
  { id: '101', name: 'Introduction to Computer Science', course_number: 'CS101', credits: 3 },
  { id: '102', name: 'Calculus I', course_number: 'MATH141', credits: 4 },
  { id: '103', name: 'English Composition', course_number: 'ENG101', credits: 3 },
];

const DEMO_GRADES = [
  { course_id: '101', course_name: 'Introduction to Computer Science', grade: 'A-', gpa: 3.7, letter_grade: 'A-' },
  { course_id: '102', course_name: 'Calculus I', grade: 'B+', gpa: 3.3, letter_grade: 'B+' },
  { course_id: '103', course_name: 'English Composition', grade: 'A', gpa: 4.0, letter_grade: 'A' },
];

const DEMO_ASSIGNMENTS = [
  { id: 'a1', course_offering_id: '101', title: 'Homework 1: Variables', due_at: '2024-09-03T23:59:00', points_possible: 100 },
  { id: 'a2', course_offering_id: '101', title: 'Quiz 1', due_at: '2024-09-10T23:59:00', points_possible: 50 },
  { id: 'a3', course_offering_id: '101', title: 'Project 1: Calculator', due_at: '2024-09-24T23:59:00', points_possible: 150 },
  { id: 'a4', course_offering_id: '102', title: 'Problem Set 1', due_at: '2024-09-05T23:59:00', points_possible: 50 },
  { id: 'a5', course_offering_id: '102', title: 'Exam 1', due_at: '2024-09-20T14:00:00', points_possible: 100 },
  { id: 'a6', course_offering_id: '103', title: 'Essay Draft 1', due_at: '2024-09-12T23:59:00', points_possible: 100 },
  { id: 'a7', course_offering_id: '103', title: 'Reading Response', due_at: '2024-09-19T23:59:00', points_possible: 50 },
];

const DEMO_SYLLABI = {
  '101': {
    title: 'CS101 - Introduction to Computer Science',
    content: `
# Course Syllabus

## Course Information
- **Course**: CS101 - Introduction to Computer Science
- **Credits**: 3
- **Instructor**: Dr. Smith
- **Office Hours**: MW 2-4pm

## Course Description
An introduction to programming and computational thinking using Python.

## Learning Objectives
- Write basic Python programs
- Understand variables, loops, and functions
- Solve problems using algorithms

## Grading
- Homework: 40%
- Quizzes: 20%
- Projects: 30%
- Participation: 10%

## Schedule
- Week 1-2: Variables and Data Types
- Week 3-4: Control Flow
- Week 5-6: Functions
- Week 7-8: Lists and Loops
    `.trim(),
  },
  '102': {
    title: 'MATH141 - Calculus I',
    content: `
# Calculus I Syllabus

## Course Information
- **Credits**: 4
- **Instructor**: Prof. Johnson

## Topics
- Limits and continuity
- Derivatives
- Integrals
- Applications
    `.trim(),
  },
  '103': {
    title: 'ENG101 - English Composition',
    content: `
# English Composition Syllabus

## Course Information
- **Credits**: 3

## Assignments
- 4 essays
- Reading responses
- Peer review participation
    `.trim(),
  },
};

export { DEMO_TERM, DEMO_COURSES, DEMO_GRADES, DEMO_ASSIGNMENTS, DEMO_SYLLABI };

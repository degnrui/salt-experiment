const path = require('node:path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { nanoid } = require('nanoid');
const { createDb } = require('./db');
const { evaluateSubmission } = require('./validation');

const errorLabels = {
  missing_materials: '缺少必要材料',
  unequal_quantities: '水量或盐量不一致',
  target_not_varied: '探究变量没有形成对比',
  control_variables_mismatch: '无关变量没有控制一致',
  salt_timing_mismatch: '加盐时机不一致',
  stir_timing_mismatch: '搅拌时机不一致'
};

function createApp(options = {}) {
  const db = createDb(options.dbPath || path.join(__dirname, '..', 'data.sqlite'));
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, '..', 'public')));

  function requireTeacher(req, res, next) {
    const teacherId = Number(req.cookies.teacherId);
    const teacher = teacherId && db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacherId);
    if (!teacher) return res.status(401).json({ error: 'unauthorized' });
    req.teacher = teacher;
    next();
  }

  app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  app.post('/api/auth/login', (req, res) => {
    const teacher = db.prepare(
      'SELECT * FROM teachers WHERE username = ? AND password = ?'
    ).get(req.body.username, req.body.password);
    if (!teacher) return res.status(401).json({ error: 'invalid_credentials' });
    res.cookie('teacherId', teacher.id, { httpOnly: true, sameSite: 'lax' });
    res.json({ id: teacher.id, username: teacher.username });
  });

  app.post('/api/classrooms', requireTeacher, (req, res) => {
    const name = String(req.body.name || '').trim();
    const groupCount = Number(req.body.groupCount || 0);
    if (!name || groupCount < 1 || groupCount > 20) {
      return res.status(400).json({ error: 'invalid_classroom' });
    }
    const classroom = db.prepare(
      'INSERT INTO classrooms (teacher_id, name) VALUES (?, ?) RETURNING *'
    ).get(req.teacher.id, name);
    const insertGroup = db.prepare(
      'INSERT INTO groups (classroom_id, name, join_code) VALUES (?, ?, ?) RETURNING *'
    );
    const groups = [];
    for (let index = 1; index <= groupCount; index += 1) {
      const group = insertGroup.get(classroom.id, `小组${index}`, nanoid(6).toUpperCase());
      groups.push({
        id: group.id,
        classroomId: group.classroom_id,
        name: group.name,
        joinCode: group.join_code
      });
    }
    res.status(201).json({ ...classroom, groups });
  });

  app.get('/api/classrooms', requireTeacher, (req, res) => {
    const rows = db.prepare(
      'SELECT * FROM classrooms WHERE teacher_id = ? ORDER BY created_at DESC, id DESC'
    ).all(req.teacher.id);
    res.json(rows);
  });

  app.post('/api/student/join', (req, res) => {
    const group = db.prepare(`
      SELECT g.*, c.name AS classroom_name
      FROM groups g
      JOIN classrooms c ON c.id = g.classroom_id
      WHERE g.join_code = ?
    `).get(String(req.body.joinCode || '').trim().toUpperCase());
    if (!group) return res.status(404).json({ error: 'invalid_join_code' });
    res.json({
      group: { id: group.id, name: group.name, joinCode: group.join_code },
      classroom: { id: group.classroom_id, name: group.classroom_name }
    });
  });

  app.post('/api/submissions', (req, res) => {
    const joinCode = String(req.body.joinCode || '').trim().toUpperCase();
    const group = db.prepare('SELECT * FROM groups WHERE join_code = ?').get(joinCode);
    if (!group) return res.status(404).json({ error: 'invalid_join_code' });
    const required = ['taskType', 'beakerA', 'beakerB'];
    if (required.some(key => !req.body[key])) {
      return res.status(400).json({ error: 'invalid_submission' });
    }
    const evaluation = evaluateSubmission(req.body);
    const row = db.prepare(`
      INSERT INTO submissions (
        classroom_id, group_id, task_type, beaker_a, beaker_b,
        salt_timing, stir_timing, is_correct, error_types
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).get(
      group.classroom_id,
      group.id,
      req.body.taskType,
      JSON.stringify(req.body.beakerA),
      JSON.stringify(req.body.beakerB),
      req.body.saltTiming || null,
      req.body.stirTiming || null,
      evaluation.isCorrect ? 1 : 0,
      JSON.stringify(evaluation.errorTypes)
    );
    res.status(201).json({
      id: row.id,
      isCorrect: evaluation.isCorrect,
      errorTypes: evaluation.errorTypes,
      errorLabels: evaluation.errorTypes.map(type => errorLabels[type])
    });
  });

  app.get('/api/classrooms/:id/dashboard', requireTeacher, (req, res) => {
    const classroom = db.prepare(
      'SELECT * FROM classrooms WHERE id = ? AND teacher_id = ?'
    ).get(req.params.id, req.teacher.id);
    if (!classroom) return res.status(404).json({ error: 'not_found' });

    const submissions = db.prepare(`
      SELECT s.*, g.name AS group_name
      FROM submissions s
      JOIN groups g ON g.id = s.group_id
      WHERE s.classroom_id = ?
      ORDER BY s.submitted_at DESC, s.id DESC
    `).all(classroom.id).map(row => ({
      id: row.id,
      groupId: row.group_id,
      groupName: row.group_name,
      taskType: row.task_type,
      beakerA: JSON.parse(row.beaker_a),
      beakerB: JSON.parse(row.beaker_b),
      saltTiming: row.salt_timing,
      stirTiming: row.stir_timing,
      isCorrect: Boolean(row.is_correct),
      errorTypes: JSON.parse(row.error_types),
      errorLabels: JSON.parse(row.error_types).map(type => errorLabels[type]),
      submittedAt: row.submitted_at
    }));
    const groups = db.prepare(
      'SELECT * FROM groups WHERE classroom_id = ? ORDER BY id ASC'
    ).all(classroom.id).map(group => ({
      id: group.id,
      name: group.name,
      joinCode: group.join_code,
      submissions: submissions.filter(submission => submission.groupId === group.id)
    }));
    const totalSubmissions = submissions.length;
    const correctSubmissions = submissions.filter(item => item.isCorrect).length;
    const taskStats = {};
    for (const taskType of ['stir', 'temp', 'size']) {
      const taskSubmissions = submissions.filter(item => item.taskType === taskType);
      taskStats[taskType] = {
        total: taskSubmissions.length,
        correct: taskSubmissions.filter(item => item.isCorrect).length,
        correctRate: taskSubmissions.length
          ? taskSubmissions.filter(item => item.isCorrect).length / taskSubmissions.length
          : 0
      };
    }
    const errorCounts = {};
    for (const type of Object.keys(errorLabels)) errorCounts[type] = 0;
    submissions.forEach(item => item.errorTypes.forEach(type => {
      errorCounts[type] += 1;
    }));
    res.json({
      classroom,
      summary: {
        totalSubmissions,
        correctSubmissions,
        correctRate: totalSubmissions ? correctSubmissions / totalSubmissions : 0
      },
      taskStats,
      errorCounts,
      errorLabels,
      groups
    });
  });

  return app;
}

if (require.main === module) {
  const app = createApp();
  const port = Number(process.env.PORT || 3000);
  app.listen(port, () => {
    console.log(`salt-experiment listening on http://localhost:${port}`);
  });
}

module.exports = { createApp };

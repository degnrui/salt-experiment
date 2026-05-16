const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../src/server');

function createTestApp() {
  return createApp({ dbPath: ':memory:' });
}

async function loginTeacher(app) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username: 'teacher', password: 'teacher123' });

  assert.equal(response.status, 200);
  return response.headers['set-cookie'];
}

test('teacher can create classroom and student can submit through group code', async () => {
  const app = createTestApp();
  const cookies = await loginTeacher(app);

  const classroom = await request(app)
    .post('/api/classrooms')
    .set('Cookie', cookies)
    .send({ name: '五年级一班', groupCount: 2 });

  assert.equal(classroom.status, 201);
  assert.equal(classroom.body.groups.length, 2);

  const join = await request(app)
    .post('/api/student/join')
    .send({ joinCode: classroom.body.groups[0].joinCode });

  assert.equal(join.status, 200);
  assert.equal(join.body.group.name, '小组1');

  const submission = await request(app)
    .post('/api/submissions')
    .send({
      joinCode: classroom.body.groups[0].joinCode,
      taskType: 'stir',
      beakerA: {
        water: { type: 'cold', amount: 2 },
        salt: { type: 'fine', amount: 2 },
        stir: 'yes'
      },
      beakerB: {
        water: { type: 'cold', amount: 2 },
        salt: { type: 'fine', amount: 2 },
        stir: 'no'
      },
      saltTiming: 'same',
      stirTiming: null
    });

  assert.equal(submission.status, 201);
  assert.equal(submission.body.isCorrect, true);
});

test('dashboard aggregates submissions and error counts', async () => {
  const app = createTestApp();
  const cookies = await loginTeacher(app);
  const classroom = await request(app)
    .post('/api/classrooms')
    .set('Cookie', cookies)
    .send({ name: '五年级二班', groupCount: 1 });
  const joinCode = classroom.body.groups[0].joinCode;

  await request(app).post('/api/submissions').send({
    joinCode,
    taskType: 'stir',
    beakerA: { water: { type: 'cold', amount: 2 }, salt: { type: 'fine', amount: 2 }, stir: 'yes' },
    beakerB: { water: { type: 'hot', amount: 3 }, salt: { type: 'coarse', amount: 2 }, stir: 'yes' },
    saltTiming: 'diff',
    stirTiming: 'diff'
  });

  const dashboard = await request(app)
    .get(`/api/classrooms/${classroom.body.id}/dashboard`)
    .set('Cookie', cookies);

  assert.equal(dashboard.status, 200);
  assert.equal(dashboard.body.summary.totalSubmissions, 1);
  assert.equal(dashboard.body.summary.correctRate, 0);
  assert.equal(dashboard.body.errorCounts.unequal_quantities, 1);
  assert.equal(dashboard.body.groups[0].submissions.length, 1);
});

test('serves student and teacher pages', async () => {
  const app = createTestApp();

  assert.equal((await request(app).get('/')).status, 200);
  assert.match((await request(app).get('/')).text, /输入小组码/);
  assert.match((await request(app).get('/student.html')).text, /确认设计/);
  assert.match((await request(app).get('/teacher.html')).text, /教师看板/);
});

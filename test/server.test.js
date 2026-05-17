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

async function registerTeacher(app, username) {
  return request(app)
    .post('/api/auth/register')
    .send({ username, password: 'secret123' });
}

test('teacher can create classroom and student can submit through group code', async () => {
  const app = createTestApp();
  const cookies = await loginTeacher(app);

  const classroom = await request(app)
    .post('/api/classrooms')
    .set('Cookie', cookies)
    .send({ name: '五年级一班', groupCount: 2, simulationType: 'salt_dissolution' });

  assert.equal(classroom.status, 201);
  assert.equal(classroom.body.groups.length, 2);
  assert.equal(classroom.body.simulationType, 'salt_dissolution');
  assert.equal(classroom.body.simulationLabel, '食盐溶解实验');

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
  assert.equal(dashboard.body.groups[0].errorStatsByTask.stir.unequal_quantities, 1);
});

test('classroom list includes display metadata for the course workspace', async () => {
  const app = createTestApp();
  const cookies = await loginTeacher(app);
  await request(app)
    .post('/api/classrooms')
    .set('Cookie', cookies)
    .send({ name: '五年级三班', groupCount: 5, simulationType: 'salt_dissolution' });

  const classrooms = await request(app)
    .get('/api/classrooms')
    .set('Cookie', cookies);

  assert.equal(classrooms.status, 200);
  assert.equal(classrooms.body[0].simulationType, 'salt_dissolution');
  assert.equal(classrooms.body[0].simulationLabel, '食盐溶解实验');
  assert.equal(classrooms.body[0].groupCount, 5);
});

test('teachers can register and only see their own classrooms', async () => {
  const app = createTestApp();
  const first = await registerTeacher(app, 'teacher_a');
  const duplicate = await registerTeacher(app, 'teacher_a');
  const second = await registerTeacher(app, 'teacher_b');
  assert.equal(first.status, 201);
  assert.equal(duplicate.status, 409);
  assert.equal(second.status, 201);

  await request(app)
    .post('/api/classrooms')
    .set('Cookie', first.headers['set-cookie'])
    .send({ name: 'A 班', groupCount: 1, simulationType: 'salt_dissolution' });
  await request(app)
    .post('/api/classrooms')
    .set('Cookie', second.headers['set-cookie'])
    .send({ name: 'B 班', groupCount: 1, simulationType: 'salt_dissolution' });

  const firstRooms = await request(app).get('/api/classrooms').set('Cookie', first.headers['set-cookie']);
  const secondRooms = await request(app).get('/api/classrooms').set('Cookie', second.headers['set-cookie']);
  assert.deepEqual(firstRooms.body.map(room => room.name), ['A 班']);
  assert.deepEqual(secondRooms.body.map(room => room.name), ['B 班']);
});

test('deleted classrooms move to trash, block joins, and can be restored', async () => {
  const app = createTestApp();
  const cookies = await loginTeacher(app);
  const classroom = await request(app)
    .post('/api/classrooms')
    .set('Cookie', cookies)
    .send({ name: '待删除课程', groupCount: 1, simulationType: 'salt_dissolution' });
  const joinCode = classroom.body.groups[0].joinCode;

  assert.equal((await request(app).delete(`/api/classrooms/${classroom.body.id}`).set('Cookie', cookies)).status, 204);
  assert.deepEqual((await request(app).get('/api/classrooms').set('Cookie', cookies)).body, []);
  assert.equal((await request(app).post('/api/student/join').send({ joinCode })).status, 404);
  const trash = await request(app).get('/api/classrooms/trash').set('Cookie', cookies);
  assert.equal(trash.body[0].name, '待删除课程');
  assert.equal((await request(app).post(`/api/classrooms/${classroom.body.id}/restore`).set('Cookie', cookies)).status, 200);
  assert.equal((await request(app).post('/api/student/join').send({ joinCode })).status, 200);
});

test('serves student and teacher pages', async () => {
  const app = createTestApp();

  assert.equal((await request(app).get('/')).status, 200);
  assert.match((await request(app).get('/')).text, /输入小组码/);
  assert.match((await request(app).get('/student.html')).text, /确认设计/);
  const teacherPage = await request(app).get('/teacher.html');
  assert.match(teacherPage.text, /课程空间/);
  assert.match(teacherPage.text, /create-modal/);
  assert.match(teacherPage.text, /detail-view/);
  assert.match(teacherPage.text, /注册/);
  assert.match(teacherPage.text, /回收站/);
});

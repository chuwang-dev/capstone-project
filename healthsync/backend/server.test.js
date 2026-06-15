const request = require('supertest');
const app = require('./server');

describe('HealthSync Backend API', () => {
  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('service', 'backend');
    });
  });

  describe('Patients Endpoints', () => {
    it('should get all patients', async () => {
      const res = await request(app)
        .get('/api/patients')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should create a new patient', async () => {
      const newPatient = {
        email: `patient-${Date.now()}@test.com`,
        name: 'Test Patient',
        date_of_birth: '1990-01-01',
        gender: 'Male',
        phone: '555-1234',
        address: '123 Test St',
      };

      const res = await request(app)
        .post('/api/patients')
        .send(newPatient)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('user_id');
    });

    it('should reject patient creation with missing required fields', async () => {
      const res = await request(app)
        .post('/api/patients')
        .send({ name: 'Test' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body).toHaveProperty('error', 'missing_required_fields');
    });

    it('should get single patient', async () => {
      const newPatient = {
        email: `patient-get-${Date.now()}@test.com`,
        name: 'Get Test',
        date_of_birth: '1995-05-05',
        gender: 'Female',
        phone: '555-9999',
      };

      const createRes = await request(app)
        .post('/api/patients')
        .send(newPatient)
        .expect(201);

      const patientId = createRes.body.data.id;

      const getRes = await request(app)
        .get(`/api/patients/${patientId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(getRes.body).toHaveProperty('data');
      expect(getRes.body.data.id).toBe(patientId);
    });

    it('should return 404 for non-existent patient', async () => {
      await request(app)
        .get('/api/patients/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('Stats Endpoint', () => {
    it('should return dashboard stats', async () => {
      const res = await request(app)
        .get('/api/stats')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('patients');
      expect(res.body).toHaveProperty('appointments');
      expect(res.body).toHaveProperty('records');
      expect(typeof res.body.patients).toBe('number');
      expect(typeof res.body.appointments).toBe('number');
      expect(typeof res.body.records).toBe('number');
    });
  });
});

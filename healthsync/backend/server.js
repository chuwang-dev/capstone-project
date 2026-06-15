require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const { createClient } = require('redis');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;

// Postgres pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DB || 'healthsync',
  port: process.env.POSTGRES_PORT || 5432,
});

// Redis client
let redisClient;
if (process.env.REDIS_HOST) {
  redisClient = createClient({ url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT || 6379}` });
  redisClient.connect().catch(err => console.warn('Redis connection failed:', err.message));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), service: 'backend' });
});

// --- PATIENTS ENDPOINTS ---

// Get all patients (with caching)
app.get('/api/patients', async (req, res) => {
  try {
    if (redisClient) {
      const cached = await redisClient.get('patients:all').catch(() => null);
      if (cached) return res.json({ from: 'cache', data: JSON.parse(cached) });
    }

    const result = await pool.query(`
      SELECT p.*, u.name, u.email FROM patients p 
      LEFT JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
    const data = result.rows;

    if (redisClient) await redisClient.set('patients:all', JSON.stringify(data), { EX: 300 }).catch(() => {});

    res.json({ from: 'db', data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// Get single patient
app.get('/api/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT p.*, u.name, u.email FROM patients p 
      LEFT JOIN users u ON p.user_id = u.id 
      WHERE p.id = $1
    `, [id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'patient_not_found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Create patient
app.post('/api/patients', async (req, res) => {
  try {
    const { email, name, date_of_birth, gender, phone, address } = req.body;

    if (!email || !name || !date_of_birth) {
      return res.status(400).json({ error: 'missing_required_fields' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        'INSERT INTO users (id, email, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE SET email=EXCLUDED.email RETURNING id',
        [uuidv4(), email, name, 'patient']
      );
      const user_id = userResult.rows[0].id;

      const patientResult = await client.query(
        'INSERT INTO patients (id, user_id, date_of_birth, gender, phone, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [uuidv4(), user_id, date_of_birth, gender, phone, address]
      );

      await client.query('COMMIT');
      if (redisClient) await redisClient.del('patients:all').catch(() => {});
      res.status(201).json({ data: patientResult.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error', message: err.message });
  }
});

// --- APPOINTMENTS ENDPOINTS ---

// Get appointments for patient
app.get('/api/patients/:patientId/appointments', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      'SELECT * FROM appointments WHERE patient_id = $1 ORDER BY appointment_date DESC',
      [patientId]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Create appointment
app.post('/api/patients/:patientId/appointments', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { doctor_name, appointment_date, notes } = req.body;

    if (!doctor_name || !appointment_date) {
      return res.status(400).json({ error: 'missing_required_fields' });
    }

    const result = await pool.query(
      'INSERT INTO appointments (id, patient_id, doctor_name, appointment_date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uuidv4(), patientId, doctor_name, appointment_date, notes || '']
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// --- MEDICAL RECORDS ENDPOINTS ---

// Get medical records for patient
app.get('/api/patients/:patientId/medical-records', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      'SELECT * FROM medical_records WHERE patient_id = $1 ORDER BY record_date DESC',
      [patientId]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Create medical record
app.post('/api/patients/:patientId/medical-records', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { record_type, description, record_date } = req.body;

    if (!record_type || !record_date) {
      return res.status(400).json({ error: 'missing_required_fields' });
    }

    const result = await pool.query(
      'INSERT INTO medical_records (id, patient_id, record_type, description, record_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [uuidv4(), patientId, record_type, description || '', record_date]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// --- MEDICATIONS ENDPOINTS ---

// Get medications for patient
app.get('/api/patients/:patientId/medications', async (req, res) => {
  try {
    const { patientId } = req.params;
    const result = await pool.query(
      'SELECT * FROM medications WHERE patient_id = $1 AND end_date IS NULL ORDER BY start_date DESC',
      [patientId]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Add medication for patient
app.post('/api/patients/:patientId/medications', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { medication_name, dosage, frequency, start_date } = req.body;

    if (!medication_name || !start_date) {
      return res.status(400).json({ error: 'missing_required_fields' });
    }

    const result = await pool.query(
      'INSERT INTO medications (id, patient_id, medication_name, dosage, frequency, start_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [uuidv4(), patientId, medication_name, dosage || '', frequency || '', start_date]
    );

    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// --- STATS ENDPOINT ---

// Get dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const [patientCount, appointmentCount, medicalRecordCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM patients'),
      pool.query('SELECT COUNT(*) as count FROM appointments'),
      pool.query('SELECT COUNT(*) as count FROM medical_records'),
    ]);

    res.json({
      patients: parseInt(patientCount.rows[0].count),
      appointments: parseInt(appointmentCount.rows[0].count),
      records: parseInt(medicalRecordCount.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Start server
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));

module.exports = app;

require('dotenv').config();
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DB || 'healthsync',
  port: process.env.POSTGRES_PORT || 5432,
});

async function seed() {
  try {
    console.log('Seeding database...');

    // Insert users
    const user1 = { id: uuidv4(), email: 'alice@example.com', name: 'Alice Johnson', role: 'patient' };
    const user2 = { id: uuidv4(), email: 'bob@example.com', name: 'Bob Smith', role: 'patient' };

    await pool.query(
      'INSERT INTO users (id, email, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      [user1.id, user1.email, user1.name, user1.role]
    );
    await pool.query(
      'INSERT INTO users (id, email, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
      [user2.id, user2.email, user2.name, user2.role]
    );

    // Insert patients
    const patient1 = { id: uuidv4(), user_id: user1.id, dob: '1990-01-15', gender: 'Female', phone: '555-0001', address: '123 Main St' };
    const patient2 = { id: uuidv4(), user_id: user2.id, dob: '1985-03-20', gender: 'Male', phone: '555-0002', address: '456 Oak Ave' };

    await pool.query(
      'INSERT INTO patients (id, user_id, date_of_birth, gender, phone, address) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO NOTHING',
      [patient1.id, patient1.user_id, patient1.dob, patient1.gender, patient1.phone, patient1.address]
    );
    await pool.query(
      'INSERT INTO patients (id, user_id, date_of_birth, gender, phone, address) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (user_id) DO NOTHING',
      [patient2.id, patient2.user_id, patient2.dob, patient2.gender, patient2.phone, patient2.address]
    );

    // Insert appointments
    await pool.query(
      'INSERT INTO appointments (patient_id, doctor_name, appointment_date, status, notes) VALUES ($1, $2, $3, $4, $5)',
      [patient1.id, 'Dr. Sarah Wilson', new Date('2026-06-15 10:00:00'), 'scheduled', 'Annual checkup']
    );

    // Insert medical records
    await pool.query(
      'INSERT INTO medical_records (patient_id, record_type, description, record_date) VALUES ($1, $2, $3, $4)',
      [patient1.id, 'Lab Results', 'Blood test results normal', new Date('2026-05-10')]
    );

    // Insert medications
    await pool.query(
      'INSERT INTO medications (patient_id, medication_name, dosage, frequency, start_date) VALUES ($1, $2, $3, $4, $5)',
      [patient1.id, 'Lisinopril', '10mg', 'Once daily', '2026-01-01']
    );

    console.log('✓ Seed data inserted successfully');
    process.exit(0);
  } catch (err) {
    console.error('✗ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  // WARNING: This is a demo stub — replace with real user validation
  if (!username || !password) return res.status(400).json({ error: 'missing_credentials' });

  // demo: accept any username/password
  const token = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: '2h' });
  res.json({ token });
});

app.get('/auth/verify', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ ok: true, payload });
  } catch (err) {
    res.status(401).json({ ok: false });
  }
});

app.listen(PORT, () => console.log(`Auth service listening on ${PORT}`));

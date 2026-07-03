const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

/* 
   REGISTER 
*/
router.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['NGO', 'Volunteer', 'Donor', 'Volunteer/Donor']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password, role } = req.body;

    try {
      const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (rows.length) return res.status(400).json({ message: 'Email already registered' });

      const hash = await bcrypt.hash(password, 10);

      const [result] = await db.query(
        'INSERT INTO users (name, email, password, role, points, profileImage) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, hash, role, 10, null]
      );

      return res.json({ message: 'Registered', userId: result.insertId });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);


/* 
   LOGIN 
 */
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    if (!rows.length) return res.status(400).json({ message: 'Invalid credentials' });

    const user = rows[0];

    // Role check
    if (role && user.role !== role)
      return res.status(400).json({ message: 'Invalid credentials' });

    // Password match
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    // Create token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
      email: user.email
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


/* 
   AUTH MIDDLEWARE
*/
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}


/* 
   GET LOGGED-IN USER (Profile)
*/
router.get('/me', auth, async (req, res) => {
  try {
    // fetch user info
    const [rows] = await db.query(
      "SELECT id, name, email, role, profileImage FROM users WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) return res.status(404).json({ message: "User not found" });

    const user = rows[0];

    /* Optional: get activities if table exists */
    let activities = [];
    try {
      const [activityRows] = await db.query(
        `SELECT e.id, e.title, e.type
         FROM event_participants p
         JOIN events e ON e.id = p.event_id
         WHERE p.user_id = ?`,
        [req.user.id]
      );

      activities = activityRows;
    } catch (err) {
      console.log("Activities table not linked or optional");
    }

    res.json({
      ...user,
      activities
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;

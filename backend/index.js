const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
const app = express();
app.use(cors());
app.use(express.json());

// DB connection
const pool = require('./db');

// DB migrations (safe for MySQL)
(async () => {
  try {
    // donations.ngo_id
    const [donCols] = await pool.query("SHOW COLUMNS FROM donations LIKE 'ngo_id'");
    if (donCols.length === 0) {
      await pool.query("ALTER TABLE donations ADD COLUMN ngo_id INT NULL");
      console.log("Added column donations.ngo_id");
    }

    // events.created_by
    const [evCols] = await pool.query("SHOW COLUMNS FROM events LIKE 'created_by'");
    if (evCols.length === 0) {
      await pool.query("ALTER TABLE events ADD COLUMN created_by INT NULL");
      console.log("Added column events.created_by");
    }

    // events.ngo_id
    const [evNgoCols] = await pool.query("SHOW COLUMNS FROM events LIKE 'ngo_id'");
    if (evNgoCols.length === 0) {
      await pool.query("ALTER TABLE events ADD COLUMN ngo_id INT NULL");
      console.log("Added column events.ngo_id");
    }

    // events.image_url - expanded column size
    const [evImgCols] = await pool.query("SHOW COLUMNS FROM events LIKE 'image_url'");
    if (evImgCols.length === 0) {
      await pool.query("ALTER TABLE events ADD COLUMN image_url VARCHAR(2000) NULL");
      console.log("Added column events.image_url");
    } else {
      // Check if existing column needs to be enlarged
      const [colInfo] = await pool.query("SHOW COLUMNS FROM events WHERE Field = 'image_url'");
      if (colInfo[0] && colInfo[0].Type !== 'longtext' && colInfo[0].Type !== 'text' && !colInfo[0].Type.includes('2000')) {
        await pool.query("ALTER TABLE events MODIFY COLUMN image_url VARCHAR(2000) NULL");
        console.log("Expanded events.image_url column to VARCHAR(2000)");
      }
    }

    // Fix foreign key constraint on events.ngo_id
    // Drop the constraint if it exists and recreate it to reference users.id instead of ngos.id
    try {
      await pool.query("ALTER TABLE events DROP FOREIGN KEY fk_events_ngo");
      console.log("Dropped old FK constraint fk_events_ngo");
    } catch(e) {
      // Constraint may not exist, that's okay
    }
    
    try {
      await pool.query("ALTER TABLE events DROP FOREIGN KEY fk_events_ngo_user");
      console.log("Dropped existing FK constraint fk_events_ngo_user if it existed");
    } catch(e) {
      // Constraint may not exist, that's okay
    }
    
    try {
      // Add new constraint
      await pool.query(
        "ALTER TABLE events ADD CONSTRAINT fk_events_ngo_user FOREIGN KEY (ngo_id) REFERENCES users(id) ON DELETE CASCADE"
      );
      console.log("Added new FK constraint: fk_events_ngo_user to users(id)");
    } catch(e) {
      if (e.code === 'ER_DUP_KEYNAME') {
        console.log("FK constraint fk_events_ngo_user already exists");
      } else {
        console.error("FK constraint error:", e.message);
      }
    }

    // ensure user_badges exists (persist earned badges)
    const [ub] = await pool.query("SHOW TABLES LIKE 'user_badges'");
    if (ub.length === 0) {
      await pool.query(`
        CREATE TABLE user_badges (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          badge_key VARCHAR(200),
          title VARCHAR(200),
          description TEXT,
          earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);
      console.log("Created table user_badges");
    }
    // This table is required for the new /feedback route to work.
    const [fb] = await pool.query("SHOW TABLES LIKE 'feedback'");
    if (fb.length === 0) {
        await pool.query(`
          CREATE TABLE feedback (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
          )
        `);
        console.log("Created table feedback");
    }

    // event_activity table - tracks volunteers, donations, feedback for each event
    const [ea] = await pool.query("SHOW TABLES LIKE 'event_activity'");
    if (ea.length === 0) {
        await pool.query(`
          CREATE TABLE event_activity (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event_id INT,
            activity_type VARCHAR(50),
            label VARCHAR(200),
            count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
          )
        `);
        console.log("Created table event_activity");
    }

  } catch (err) {
    console.error("Migration error:", err);
  }
})();

// ----------------------------------------------
// ROUTES
// ----------------------------------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/actions', require('./routes/actions')); 
app.use('/api/chat', require('./routes/chatbot'));
app.use('/api/ngo', require('./routes/ngo'));

// ----------------------------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
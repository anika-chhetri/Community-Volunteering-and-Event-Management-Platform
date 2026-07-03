const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ngo_db',
});

(async () => {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    console.log('=== Tables ===');
    tables.forEach(t => console.log(Object.values(t)[0]));
    
    const [eventCols] = await pool.query('DESCRIBE events');
    console.log('\n=== Events Columns ===');
    eventCols.forEach(c => console.log(c.Field + ' (' + c.Type + ')'));
    
    const [ngoCols] = await pool.query('DESCRIBE ngos');
    console.log('\n=== NGOs Columns ===');
    ngoCols.forEach(c => console.log(c.Field + ' (' + c.Type + ')'));

    const [eventCount] = await pool.query('SELECT COUNT(*) as count FROM events');
    console.log('\n=== Counts ===');
    console.log('Events:', eventCount[0].count);
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();

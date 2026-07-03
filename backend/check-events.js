const db = require('./db');

(async () => {
  try {
    const [events] = await db.query("SELECT id, title, ngo_id, created_by, date FROM events LIMIT 10");
    console.log('Events:');
    console.log(JSON.stringify(events, null, 2));
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
})();

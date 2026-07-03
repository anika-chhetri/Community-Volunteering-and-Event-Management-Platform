const db = require('./db');

(async () => {
  try {
    const [ngos] = await db.query("SELECT id, name, role, email FROM users WHERE role='NGO' LIMIT 5");
    console.log('NGO Users:');
    console.log(JSON.stringify(ngos, null, 2));
  } catch(e) {
    console.error(e.message);
  }
  process.exit(0);
})();

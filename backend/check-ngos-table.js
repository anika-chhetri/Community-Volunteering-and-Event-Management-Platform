const db = require('./db');

(async () => {
  try {
    const [ngos] = await db.query("SELECT id, name FROM ngos");
    console.log('NGOs table:');
    console.log(JSON.stringify(ngos, null, 2));
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();

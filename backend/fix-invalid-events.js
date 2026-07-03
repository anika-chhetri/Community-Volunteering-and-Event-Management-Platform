const db = require('./db');

(async () => {
  try {
    console.log('Updating events with invalid NGO IDs...');
    
    // Get first NGO user
    const [ngos] = await db.query("SELECT id FROM users WHERE role='NGO' ORDER BY id ASC LIMIT 1");
    if (!ngos.length) {
      console.log('No NGO users found!');
      process.exit(0);
    }
    
    const validNgoId = ngos[0].id;
    console.log(`Using NGO ID: ${validNgoId}`);
    
    // Update events that have invalid NGO ID (1) to use valid NGO ID
    const [result] = await db.query(
      "UPDATE events SET ngo_id = ?, created_by = ? WHERE ngo_id = ? OR ngo_id IS NULL",
      [validNgoId, validNgoId, 1]
    );
    
    console.log(`Updated events: ${result.affectedRows} rows changed`);
    
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();

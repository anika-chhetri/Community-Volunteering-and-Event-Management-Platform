const db = require('./db');

(async () => {
  try {
    console.log('\n========== DATABASE VERIFICATION ==========\n');
    
    // Check events with created_by and ngo_id
    const [events] = await db.query("SELECT id, title, ngo_id, created_by FROM events LIMIT 10");
    console.log('Events Status:');
    let hasAllCreatedBy = true;
    events.forEach(e => {
      const status = e.created_by ? '✓' : '✗';
      console.log(`  ${status} Event ${e.id}: "${e.title}" - created_by=${e.created_by}, ngo_id=${e.ngo_id}`);
      if (!e.created_by) hasAllCreatedBy = false;
    });
    
    // Check NGO users
    const [ngos] = await db.query("SELECT id, name, role FROM users WHERE role='NGO'");
    console.log('\nNGO Users:');
    ngos.forEach(n => console.log(`  - ID ${n.id}: ${n.name}`));
    
    // Check if we can match events to NGOs
    console.log('\nEvent-NGO Mapping:');
    events.forEach(e => {
      const ngo = ngos.find(n => n.id === e.ngo_id);
      const createdBy = ngos.find(n => n.id === e.created_by);
      console.log(`  Event ${e.id}: NGO=${ngo?.name || 'N/A'}, CreatedBy=${createdBy?.name || 'N/A'}`);
    });
    
    console.log('\n========== STATUS ==========');
    console.log(`All events have created_by: ${hasAllCreatedBy ? 'YES ✓' : 'NO ✗'}`);
    console.log('Total events:', events.length);
    console.log('Total NGO users:', ngos.length);
    
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();

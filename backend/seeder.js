const db = require('./db');

(async () => {
  try {
    // Only seed events if table is empty
    const [countRows] = await db.query('SELECT COUNT(*) AS cnt FROM events');
    if (!countRows || countRows[0].cnt < 5) {
      await db.query(`
        INSERT INTO events (title, description, image_url) VALUES
        ('Beach Cleanup', 'Community beach clean-up event', 'https://tse3.mm.bing.net/th/id/OIP.2TSCRGKZuAj3p6FZ57BkuAHaE8'),
        ('Food Drive', 'Collecting non-perishable food items', 'https://tse3.mm.bing.net/th/id/OIP.4XdhJHz05TwATDpIISDw4QHaE8'),
        ('Tree Plantation', 'Join us to plant trees in urban areas', 'https://tse4.mm.bing.net/th/id/OIP.qRbub030UD8h8BmkIDmXrA'),
        ('Education Support', 'Support underprivileged children with supplies', 'https://tse1.mm.bing.net/th/id/OIP.0x9LG00FrxuQflQMcyFpJAHaE7'),
        ('Health Camp', 'Free medical checkups and awareness programs', 'https://tse4.mm.bing.net/th/id/OIP.sBW0IdYTTfjzyAfLDzWaOgHaEm')
      `);
      console.log('Seeded events');
    } else {
      console.log('Events already seeded');
    }

    // create admin if not exists
    const [rows] = await db.query('SELECT id FROM users WHERE role = "Admin" LIMIT 1');
    if (!rows.length) {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('adminpass', 10);
      await db.query(
        'INSERT INTO users (name,email,password,role,points) VALUES(?,?,?,?,?)',
        ['Administrator', 'admin@ngo.local', hash, 'Admin', 0]
      );
      console.log('Admin created: admin@ngo.local / adminpass');
    }

    // create a sample NGO if none exists
    const [ngoRows] = await db.query('SELECT id FROM users WHERE role = "NGO" LIMIT 1');
    let sampleNgoId = null;

    if (!ngoRows.length) {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('ngopass', 10);
      const [res] = await db.query(
        'INSERT INTO users (name,email,password,role,points) VALUES(?,?,?,?,?)',
        ['Helping Hands', 'ngo@helping.local', hash, 'NGO', 0]
      );
      sampleNgoId = res.insertId;
      console.log('Sample NGO created: ngo@helping.local / ngopass');
    } else {
      sampleNgoId = ngoRows[0].id;
    }

    console.log('Seeding complete');
    process.exit(0);

  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();

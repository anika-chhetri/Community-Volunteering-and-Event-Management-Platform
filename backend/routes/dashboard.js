const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../db');
const router = express.Router();

function authMiddleware(req,res,next){
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({message:'No token'});
  const token = auth.split(' ')[1];
  try{
    const data = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = data; next();
  }catch(e){ return res.status(401).json({message:'Invalid token'}); }
}

router.get('/me', authMiddleware, async (req,res)=>{
  try{
    const [rows] = await db.query('SELECT id,name,email,role,points FROM users WHERE id=?',[req.user.id]);
    if (!rows.length) return res.status(404).json({message:'User not found'});
    const user = rows[0];
    // recognition: only for non-admins
    res.json({ user });
  }catch(err){ console.error(err); res.status(500).json({message:'Server error'}); }
});

router.get('/events', async (req,res)=>{
  try{
    const [rows] = await db.query(
      'SELECT id, title, description, location, date, image_url, ngo_id, created_by, requiredVolunteers, createdAt FROM events ORDER BY id DESC'
    );
    res.json(rows);
  }catch(err){ 
    console.error(err); 
    res.status(500).json({message:'Server error'}); 
  }
});

router.get('/events/:id', async (req,res)=>{
  try{
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM events WHERE id = ? LIMIT 1',[id]);
    if (!rows.length) return res.status(404).json({message:'Event not found'});
    res.json(rows[0]);
  }catch(err){ console.error(err); res.status(500).json({message:'Server error'}); }
});

router.get('/my-activities', authMiddleware, async (req,res)=>{
  try{
    const userId = req.user.id;
    const [vols] = await db.query('SELECT v.id,v.event_id,e.title,e.image_url,e.description,v.created_at FROM volunteers v LEFT JOIN events e ON v.event_id=e.id WHERE v.user_id = ? ORDER BY v.created_at DESC',[userId]);
    const [dons] = await db.query('SELECT id,amount,created_at FROM donations WHERE user_id = ? ORDER BY created_at DESC',[userId]);
    const [fbacks] = await db.query('SELECT id,text,created_at FROM feedback WHERE user_id = ? ORDER BY created_at DESC',[userId]);
    res.json({volunteers: vols, donations: dons, feedbacks: fbacks});
  }catch(err){ console.error(err); res.status(500).json({message:'Server error'}); }
});

// ✅ NEW: User Summary with Role-Specific Stats
router.get('/user-summary', authMiddleware, async (req,res)=>{
  try{
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get user info
    const [userRows] = await db.query('SELECT id,name,email,role,points FROM users WHERE id=?',[userId]);
    if(!userRows.length) return res.status(404).json({message:'User not found'});
    
    const user = userRows[0];
    let stats = {};

    if(userRole === 'Admin'){
      // Admin: show total users, events, volunteers
      const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
      const [eventCount] = await db.query('SELECT COUNT(*) as count FROM events');
      const [volCount] = await db.query('SELECT COUNT(*) as count FROM volunteers');
      
      stats = {
        totalUsers: userCount[0]?.count || 0,
        totalEvents: eventCount[0]?.count || 0,
        totalVolunteers: volCount[0]?.count || 0
      };
    }else if(userRole === 'NGO'){
      // NGO: show events hosted, volunteers, donations
      const [eventsHosted] = await db.query('SELECT COUNT(*) as count FROM events WHERE created_by=?',[userId]);
      const [volunteerCount] = await db.query(
        'SELECT COUNT(*) as count FROM volunteers v LEFT JOIN events e ON v.event_id=e.id WHERE e.created_by=?',
        [userId]
      );
      const [donationCount] = await db.query('SELECT COUNT(*) as count FROM donations WHERE ngo_id=?',[userId]);
      const [donationSum] = await db.query('SELECT SUM(amount) as total FROM donations WHERE ngo_id=?',[userId]);
      
      stats = {
        eventsHosted: eventsHosted[0]?.count || 0,
        volunteerCount: volunteerCount[0]?.count || 0,
        donationCount: donationCount[0]?.count || 0,
        totalDonated: donationSum[0]?.total || 0
      };
    }else{
      // Volunteer/Donor: show participation, donations
      const [volunteerCount] = await db.query('SELECT COUNT(*) as count FROM volunteers WHERE user_id=?',[userId]);
      const [donationCount] = await db.query('SELECT COUNT(*) as count FROM donations WHERE user_id=?',[userId]);
      const [donationSum] = await db.query('SELECT SUM(amount) as total FROM donations WHERE user_id=?',[userId]);
      
      stats = {
        totalParticipation: (volunteerCount[0]?.count || 0) + (donationCount[0]?.count || 0),
        volunteerCount: volunteerCount[0]?.count || 0,
        donationCount: donationCount[0]?.count || 0,
        totalDonated: donationSum[0]?.total || 0
      };
    }

    res.json({ user, stats });
  }catch(err){ 
    console.error(err); 
    res.status(500).json({message:'Server error'}); 
  }
});

module.exports = router;

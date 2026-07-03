const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

// ---------------------- AUTH MIDDLEWARE ----------------------
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "secret");
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
}

// GET: List All Registered NGOs
router.get("/list", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM ngos ORDER BY id DESC");
    res.json({ ngos: rows });
  } catch (err) {
    console.error("Error fetching NGOs:", err);
    res.status(500).json({ message: "Error fetching NGOs" });
  }
});

// GET: All Events With NGO Name
router.get("/events", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
         e.*, 
         n.name AS ngo_name 
       FROM events e 
       LEFT JOIN ngos n ON e.ngo_id = n.id 
       ORDER BY e.id DESC`
    );

    res.json({ events: rows });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ message: "Error fetching events" });
  }
});

// POST: Register a New NGO
router.post("/add", async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "NGO name is required" });
    }

    await db.query(
      "INSERT INTO ngos (name, description) VALUES (?, ?)",
      [name, description || ""]
    );

    res.json({ message: "NGO registered successfully" });
  } catch (err) {
    console.error("Error adding NGO:", err);
    res.status(500).json({ message: "Error adding NGO" });
  }
});

// POST: Add New Event (ADMIN PANEL)
router.post("/events/add", async (req, res) => {
  try {
    const { title, description, image_url, ngo_id } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    await db.query(
      "INSERT INTO events (title, description, image_url, ngo_id) VALUES (?, ?, ?, ?)",
      [title, description || "", image_url || "", ngo_id || null]
    );

    res.json({ message: "Event added successfully" });
  } catch (err) {
    console.error("Error adding event:", err);
    res.status(500).json({ message: "Error adding event" });
  }
});

// GET: Specific NGO + All Events Under It
router.get("/ngo/:id", async (req, res) => {
  try {
    let ngoId = parseInt(req.params.id, 10);

    const [check] = await db.query(
      "SELECT ngo_id FROM events WHERE id = ?",
      [ngoId]
    );

    if (check.length && check[0].ngo_id) {
      ngoId = check[0].ngo_id;
    }

    const [ngoRows] = await db.query(
      "SELECT id, name, description FROM ngos WHERE id = ?",
      [ngoId]
    );
    const ngo = ngoRows[0];

    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    const [events] = await db.query(
      "SELECT * FROM events WHERE ngo_id = ? ORDER BY id DESC",
      [ngoId]
    );

    res.json({ ngo, events });

  } catch (err) {
    console.error("Error fetching NGO:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// POST: NGO Creates an Event (Frontend uses this)
router.post("/create-event", auth, async (req, res) => {
  try {
    // Only NGO users can create events
    if (req.user.role !== 'NGO') {
      return res.status(403).json({ msg: "Only NGO users can create events" });
    }

    const { title, description, location, date, requiredVolunteers, image_url } = req.body;

    if (!title || !location || !date) {
      return res.status(400).json({ msg: "Missing required fields: title, location, date" });
    }

    const ngoUserId = req.user.id;

    const [result] = await db.query(
      `INSERT INTO events (title, description, location, date, requiredVolunteers, created_by, ngo_id, image_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, location, date, requiredVolunteers, ngoUserId, ngoUserId, image_url || null]
    );

    const eventId = result.insertId;

    // Return the created event with all fields
    res.json({
      msg: "Event created successfully",
      event: { 
        id: eventId, 
        title, 
        description,
        location, 
        date, 
        requiredVolunteers, 
        image_url: image_url || null, 
        created_by: ngoUserId, 
        ngo_id: ngoUserId,
        volunteers_count: 0
      }
    });
  } catch (err) {
    console.error("Error creating event:", err);
    res.status(500).json({ msg: "Server error creating event" });
  }
});

// GET: Volunteers List (NGO users only)
router.get("/volunteers", auth, async (req, res) => {
  try {
    // Get volunteers for the current NGO's events only
    const ngoId = req.user.id;
    
    const [rows] = await db.query(`
      SELECT 
        v.id,
        v.user_id,
        v.event_id,
        v.created_at AS registered_at,
        u.name AS user_name, 
        u.email AS user_email,
        e.title AS event_title,
        e.date AS event_date,
        e.location AS event_location
      FROM volunteers v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN events e ON v.event_id = e.id
      WHERE v.ngo_id = ?
      ORDER BY v.created_at DESC
    `, [ngoId]);

    res.json({ volunteers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching volunteers" });
  }
});

// GET: Event Participants Breakdown (shows participation by event)
router.get("/event-participants", auth, async (req, res) => {
  try {
    const ngoId = req.user.id;
    
    // Get events with their volunteer counts
    const [events] = await db.query(`
      SELECT 
        e.id,
        e.title,
        e.date,
        e.location,
        e.requiredVolunteers,
        COUNT(v.id) AS volunteer_count,
        GROUP_CONCAT(CONCAT(u.name, ' (', u.email, ')') SEPARATOR '; ') AS volunteer_list
      FROM events e
      LEFT JOIN volunteers v ON e.id = v.event_id
      LEFT JOIN users u ON v.user_id = u.id
      WHERE e.ngo_id = ?
      GROUP BY e.id
      ORDER BY e.date DESC
    `, [ngoId]);

    res.json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching event participants" });
  }
});

// GET: Donations List
router.get("/donations", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT d.*, u.name AS donor_name, u.email AS donor_email
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.id DESC
    `);

    res.json({ donations: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching donations" });
  }
});

// GET: Achievements Summary
router.get("/achievements", async (req, res) => {
  try {
    const [[totals]] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM events) AS totalEvents,
        (SELECT COUNT(*) FROM volunteers) AS totalVolunteers,
        (SELECT IFNULL(SUM(amount), 0) FROM donations) AS totalDonations
    `);

    const [topEvents] = await db.query(`
      SELECT e.id, e.title, e.image_url,
             COUNT(v.id) AS volunteers_count
      FROM events e
      LEFT JOIN volunteers v ON e.id = v.event_id
      GROUP BY e.id
      ORDER BY volunteers_count DESC
      LIMIT 5
    `);

    res.json({
      totals,
      topEvents,
      successfulEvents: totals.totalEvents // You can replace with a real formula
    });

  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: "Error fetching achievements" });
  }
});
// GET: Top Volunteer Today
router.get("/top-volunteer-today", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, COUNT(v.id) AS total
      FROM volunteers v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE DATE(v.created_at) = CURDATE()
      GROUP BY u.id
      ORDER BY total DESC
      LIMIT 1
    `);

    res.json({ topVolunteerToday: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching top volunteer today" });
  }
});
router.get("/top-volunteer-month", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, COUNT(v.id) AS total
      FROM volunteers v
      LEFT JOIN users u ON v.user_id = u.id
      WHERE MONTH(v.created_at) = MONTH(CURDATE())
        AND YEAR(v.created_at) = YEAR(CURDATE())
      GROUP BY u.id
      ORDER BY total DESC
      LIMIT 1
    `);

    res.json({ topVolunteerMonth: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching top volunteer of month" });
  }
});
router.get("/top-donor-today", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, SUM(d.amount) AS total
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE DATE(d.created_at) = CURDATE()
      GROUP BY u.id
      ORDER BY total DESC
      LIMIT 1
    `);

    res.json({ topDonorToday: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching top donor today" });
  }
});
router.get("/top-donor-month", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, SUM(d.amount) AS total
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE MONTH(d.created_at) = MONTH(CURDATE())
        AND YEAR(d.created_at) = YEAR(CURDATE())
      GROUP BY u.id
      ORDER BY total DESC
      LIMIT 1
    `);

    res.json({ topDonorMonth: rows[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching top donor of month" });
  }
});
router.get("/badges", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, email, badge, volunteer_points, donor_points
      FROM users
      WHERE badge IS NOT NULL AND badge <> 'None'
      ORDER BY volunteer_points + donor_points DESC
    `);

    res.json({ badges: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Error fetching badges" });
  }
});
router.get("/most-active", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        n.id,
        n.name,
        COALESCE(e.event_count, 0) +
        COALESCE(v.volunteer_count, 0) +
        COALESCE(d.donation_count, 0) AS activity_score
      FROM ngos n
      LEFT JOIN (
        SELECT ngo_id, COUNT(*) AS event_count
        FROM events
        GROUP BY ngo_id
      ) e ON n.id = e.ngo_id
      LEFT JOIN (
        SELECT ngo_id, COUNT(*) AS volunteer_count
        FROM volunteers
        GROUP BY ngo_id
      ) v ON n.id = v.ngo_id
      LEFT JOIN (
        SELECT ngo_id, COUNT(*) AS donation_count
        FROM donations
        GROUP BY ngo_id
      ) d ON n.id = d.ngo_id
      ORDER BY activity_score DESC
      LIMIT 1;
    `);

    res.json(rows[0]);
  } catch (err) {
    console.error("Most active NGO error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET: User Participation for a Specific NGO
router.get("/participation/:ngoId/:userId", async (req, res) => {
  try {
    const { ngoId, userId } = req.params;

    // Fetch volunteer participation
    const [volData] = await db.query(`
      SELECT 
        v.id,
        'Volunteered' AS type,
        e.title AS event_title,
        v.created_at AS participated_on
      FROM volunteers v
      LEFT JOIN events e ON v.event_id = e.id
      WHERE v.user_id = ? AND e.ngo_id = ?
      ORDER BY v.created_at DESC
    `, [userId, ngoId]);

    // Fetch donation participation
    const [donData] = await db.query(`
      SELECT 
        d.id,
        'Donated' AS type,
        CONCAT('Donation of ₹', d.amount) AS event_title,
        d.created_at AS participated_on
      FROM donations d
      WHERE d.user_id = ? AND d.ngo_id = ?
      ORDER BY d.created_at DESC
    `, [userId, ngoId]);

    res.json({
      participation: [...volData, ...donData]
    });

  } catch (err) {
    console.error("Participation fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------------- GET MY DONATIONS (NGO SPECIFIC) ----------------------
router.get("/my-donations", auth, async (req, res) => {
  try {
    if (req.user.role !== "NGO") {
      return res.status(403).json({ message: "Only NGO users can view this" });
    }

    const ngoId = req.user.id;

    // Get all donations received by this NGO
    const [donations] = await db.query(`
      SELECT 
        d.id,
        d.amount,
        d.created_at,
        u.name AS donor_name,
        u.email AS donor_email,
        e.title AS event_title
      FROM donations d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN events e ON d.event_id = e.id
      WHERE d.ngo_id = ?
      ORDER BY d.created_at DESC
    `, [ngoId]);

    // Calculate total raised
    const [[totals]] = await db.query(`
      SELECT IFNULL(SUM(amount), 0) AS totalRaised
      FROM donations
      WHERE ngo_id = ?
    `, [ngoId]);

    res.json({
      donations: donations,
      totalRaised: totals.totalRaised || 0
    });
  } catch (err) {
    console.error("Error fetching my donations:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------- DELETE EVENT ----------------------
router.delete("/delete-event/:id", auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // Get event to verify ownership
    const [[event]] = await db.query(
      "SELECT id, created_by, ngo_id FROM events WHERE id = ?",
      [eventId]
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user is owner (created_by) or ngo_id matches, or admin
    const isOwner = req.user.id === event.created_by || req.user.id === event.ngo_id;
    const isAdmin = req.user.role === "Admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Unauthorized to delete this event" });
    }

    console.log(`Deleting event ${eventId} - created_by: ${event.created_by}, ngo_id: ${event.ngo_id}, user: ${req.user.id}`);

    // Delete all related data in cascade
    // 1. Delete volunteers
    await db.query("DELETE FROM volunteers WHERE event_id = ?", [eventId]);
    console.log(`Deleted volunteers for event ${eventId}`);
    
    // 2. Delete donations
    await db.query("DELETE FROM donations WHERE event_id = ?", [eventId]);
    console.log(`Deleted donations for event ${eventId}`);
    
    // 3. Delete feedback
    await db.query("DELETE FROM feedback WHERE event_id = ?", [eventId]);
    console.log(`Deleted feedback for event ${eventId}`);
    
    // 4. Delete event activity
    await db.query("DELETE FROM event_activity WHERE event_id = ?", [eventId]);
    console.log(`Deleted event_activity for event ${eventId}`);
    
    // 5. Delete the event itself
    const [deleteResult] = await db.query("DELETE FROM events WHERE id = ?", [eventId]);
    console.log(`Deleted event ${eventId}`, deleteResult);

    res.json({ message: "Event deleted successfully along with all related data" });
  } catch (err) {
    console.error("Error deleting event:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ---------------------- GET NGO INFO BY ID ----------------------
router.get("/info/:ngoId", async (req, res) => {
  try {
    const ngoId = req.params.ngoId;
    const [[ngo]] = await db.query(
      "SELECT id, name, email, role FROM users WHERE id = ? AND role = 'NGO'",
      [ngoId]
    );

    if (!ngo) {
      return res.status(404).json({ message: "NGO not found" });
    }

    res.json(ngo);
  } catch (err) {
    console.error("Error fetching NGO info:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------- GET NGO EVENTS (FOR ADMIN DELETE) ----------------------
router.get("/ngo-events/:ngoId", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Only admins can view NGO events" });
    }
    
    const ngoId = req.params.ngoId;
    const [events] = await db.query(
      "SELECT id, title, description, location, date, image_url, requiredVolunteers FROM events WHERE ngo_id = ? ORDER BY date DESC",
      [ngoId]
    );
    
    res.json({ events });
  } catch (err) {
    console.error("Error fetching NGO events:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------- VOLUNTEER FOR EVENT ----------------------
router.post("/volunteer-for-event", auth, async (req, res) => {
  try {
    const { eventId } = req.body;
    
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    // Get event info
    const [[event]] = await db.query(
      "SELECT id, ngo_id FROM events WHERE id = ?",
      [eventId]
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if already volunteered
    const [[existing]] = await db.query(
      "SELECT id FROM volunteers WHERE user_id = ? AND event_id = ?",
      [req.user.id, eventId]
    );

    if (existing) {
      return res.status(400).json({ message: "You already volunteered for this event" });
    }

    // Add volunteer entry
    const [result] = await db.query(
      "INSERT INTO volunteers (user_id, event_id, ngo_id, created_at) VALUES (?, ?, ?, NOW())",
      [req.user.id, eventId, event.ngo_id]
    );

    // Update user points
    await db.query(
      "UPDATE users SET volunteer_points = IFNULL(volunteer_points,0) + 10, points = IFNULL(points,0) + 10 WHERE id=?",
      [req.user.id]
    );

    // Check for badge
    const [[userPoints]] = await db.query("SELECT volunteer_points FROM users WHERE id=?", [req.user.id]);
    const volPoints = userPoints.volunteer_points;
    let badge = null;
    if (volPoints >= 500) badge = "Platinum Volunteer";
    else if (volPoints >= 300) badge = "Gold Volunteer";
    else if (volPoints >= 100) badge = "Silver Volunteer";
    else if (volPoints >= 50) badge = "Bronze Volunteer";

    if (badge) {
      await db.query(
        "INSERT INTO user_badges (user_id,badge_key,title,description,earned_at) VALUES (?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE earned_at=NOW()",
        [req.user.id, badge, badge, `${volPoints}+ volunteer points`]
      );
    }

    res.json({ message: "Successfully volunteered for event", volunteerId: result.insertId });
  } catch (err) {
    console.error("Error volunteering:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------- GET EVENT ACTIVITY/COMPLETION ----------------------
router.get("/event-activity/:eventId", auth, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    // Get event details
    const [event] = await db.query("SELECT * FROM events WHERE id = ?", [eventId]);
    if (!event || !event.length) {
      return res.status(404).json({ message: "Event not found" });
    }

    const ev = event[0];

    // Count volunteers
    const [volCount] = await db.query(
      "SELECT COUNT(*) as count FROM volunteers WHERE event_id = ?",
      [eventId]
    );
    const volunteerCount = volCount[0].count;

    // Count donations
    const [donCount] = await db.query(
      "SELECT COUNT(*) as count, SUM(amount) as total FROM donations WHERE event_id = ?",
      [eventId]
    );
    const donationCount = donCount[0].count;
    const donationTotal = donCount[0].total || 0;

    // Count feedback
    const [fbCount] = await db.query(
      "SELECT COUNT(*) as count FROM feedback WHERE event_id = ?",
      [eventId]
    );
    const feedbackCount = fbCount[0].count;

    const activities = [];
    if (volunteerCount > 0) activities.push({ type: 'volunteer', count: volunteerCount, label: `${volunteerCount} volunteer(s) registered` });
    if (donationCount > 0) activities.push({ type: 'donation', count: donationCount, label: `${donationCount} donation(s) received (₹${donationTotal})` });
    if (feedbackCount > 0) activities.push({ type: 'feedback', count: feedbackCount, label: `${feedbackCount} feedback(s) received` });

    res.json({ event: ev, activities });
  } catch (err) {
    console.error("Error fetching event activity:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

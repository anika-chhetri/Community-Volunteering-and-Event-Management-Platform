const express = require("express");
const db = require("../db");
const jwt = require("jsonwebtoken");
const router = express.Router();

// ---------------------- AUTH ----------------------
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET || "secret");
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// ---------------------- SUBMIT FEEDBACK ----------------------
router.post("/feedback", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Feedback text is required." });
    }

    await db.query(
      "INSERT INTO feedback (user_id, text, created_at) VALUES (?,?,NOW())",
      [req.user.id, text]
    );

    res.json({ message: "Feedback recorded successfully" });
  } catch (e) {
    console.error("Feedback error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------- NGOS LIST ----------------------
router.get("/ngos", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id,name,email FROM users WHERE role='NGO' ORDER BY id DESC");
    res.json({ ngos: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- ALL USERS LIST (ADMIN ONLY) ----------------------
router.get("/all-users", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, email, role FROM users ORDER BY id DESC");
    res.json({ users: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- DONATE ----------------------
router.post("/donate", auth, async (req, res) => {
  try {
    const { amount, ngo_id, event_id } = req.body;

    await db.query(
      "INSERT INTO donations (user_id,amount,ngo_id,event_id,created_at) VALUES (?,?,?,?,NOW())",
      [req.user.id, amount, ngo_id || null, event_id || null]
    );

    await db.query(
      "UPDATE users SET donor_points = IFNULL(donor_points,0) + ?, points = IFNULL(points,0) + ? WHERE id=?",
      [amount, amount, req.user.id]
    );

    // 🔹 Badge assignment (minimal addition, doesn't affect existing functionality)
    const [[user]] = await db.query("SELECT donor_points FROM users WHERE id=?", [req.user.id]);
    const donorPoints = user.donor_points;
    let badge = null;
    if (donorPoints >= 5000) badge = "Platinum Donor";
    else if (donorPoints >= 3000) badge = "Gold Donor";
    else if (donorPoints >= 1000) badge = "Silver Donor";
    else if (donorPoints >= 200) badge = "Bronze Donor";

    if (badge) {
      await db.query(
        "INSERT INTO user_badges (user_id,badge_key,title,description,earned_at) VALUES (?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE earned_at=NOW()",
        [req.user.id, badge, badge, `₹${donorPoints}+ donations`]
      );
    }

    res.json({ message: "Donation recorded" });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- VOLUNTEER ----------------------
router.post("/volunteer", auth, async (req, res) => {
  try {
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ message: "event_id is required" });
    }

    // Get the event and ngo_id
    const [[event]] = await db.query(
      "SELECT id, ngo_id FROM events WHERE id = ?",
      [event_id]
    );

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const ngo_id = event.ngo_id;

    // Check if already volunteered
    const [[existing]] = await db.query(
      "SELECT id FROM volunteers WHERE user_id = ? AND event_id = ?",
      [req.user.id, event_id]
    );

    if (existing) {
      return res.status(400).json({ message: "You already volunteered for this event" });
    }

    await db.query(
      "INSERT INTO volunteers (user_id, event_id, ngo_id, created_at) VALUES (?,?,?,NOW())",
      [req.user.id, event_id, ngo_id]
    );

    await db.query(
      "UPDATE users SET volunteer_points = IFNULL(volunteer_points,0) + 10, points = IFNULL(points,0) + 10 WHERE id=?",
      [req.user.id]
    );

    // 🔹 Badge assignment (minimal addition, doesn't affect existing functionality)
    const [[user]] = await db.query("SELECT volunteer_points FROM users WHERE id=?", [req.user.id]);
    const volPoints = user.volunteer_points;
    let badge = null;
    if (volPoints >= 20) badge = "Gold Volunteer";
    else if (volPoints >= 10) badge = "Silver Volunteer";
    else if (volPoints >= 5) badge = "Bronze Volunteer";

    if (badge) {
      await db.query(
        "INSERT INTO user_badges (user_id,badge_key,title,description,earned_at) VALUES (?,?,?,?,NOW()) ON DUPLICATE KEY UPDATE earned_at=NOW()",
        [req.user.id, badge, badge, `${volPoints} events participated`]
      );
    }

    res.json({ message: "Volunteer registered successfully!" });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});


// ---------------------- ADMIN REPORTS ----------------------
router.get("/reports", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Forbidden" });

    const [donations] = await db.query(`SELECT d.id,d.amount,d.created_at,u.name,u.email
      FROM donations d LEFT JOIN users u ON d.user_id=u.id
      ORDER BY d.created_at DESC`);

    const [volunteers] = await db.query(`SELECT v.id,v.created_at,e.title AS event_title,u.name,u.email
      FROM volunteers v
      LEFT JOIN users u ON v.user_id=u.id
      LEFT JOIN events e ON v.event_id=e.id
      ORDER BY v.created_at DESC`);

    const [feedbacks] = await db.query(`SELECT f.id,f.text,f.created_at,u.name,u.email
      FROM feedback f
      LEFT JOIN users u ON f.user_id=u.id
      ORDER BY f.created_at DESC`);

    res.json({ donations, volunteers, feedbacks });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- REGISTERED EVENTS (ADMIN) ----------------------
router.get("/registered-events", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Forbidden" });

    const [rows] = await db.query(`SELECT e.*,u.id AS ngo_id,u.name AS ngo_name,u.email AS ngo_email
      FROM events e LEFT JOIN users u ON e.created_by=u.id
      ORDER BY e.created_at DESC`);

    res.json({ events: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- EVENT STATS ----------------------
router.get("/event-stats", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Forbidden" });

    const [rows] = await db.query(`SELECT e.id,e.title,e.image_url,
               COUNT(DISTINCT v.id) AS volunteers_count,
               IFNULL(SUM(d.amount),0) AS donations_sum
      FROM events e
      LEFT JOIN volunteers v ON v.event_id=e.id
      LEFT JOIN donations d ON d.event_id=e.id
      GROUP BY e.id
      ORDER BY e.created_at DESC`);

    res.json({ events: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

/// ---------------------- USER ACHIEVEMENTS + BADGE SAVE ----------------------
router.get("/achievements", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [vols] = await db.query(`SELECT v.id FROM volunteers v WHERE v.user_id=?`, [userId]);
    const [dons] = await db.query(`SELECT d.amount FROM donations d WHERE d.user_id=?`, [userId]);

    const totalVols = vols.length;
    const donatedSum = dons.reduce((s, r) => s + (r.amount || 0), 0);

    const badges = [];

    // Volunteer badges
if (totalVols >= 5) badges.push({ 
  key: "Bronze Volunteer", 
  title: "Bronze Volunteer", 
  desc: "5+ events",
  image: "https://up.yimg.com/ib/th/id/OIP.OHs_yaTRMl1wF9glVaPZmgHaHa?pid=Api&rs=1&c=1&qlt=95&w=105&h=105"
});
if (totalVols >= 10) badges.push({ 
  key: "Silver Volunteer", 
  title: "Silver Volunteer", 
  desc: "7+ events",
  image: "https://up.yimg.com/ib/th/id/OIP.8jVsS3Paqnphh1RUaZRO_gHaHa?pid=Api&rs=1&c=1&qlt=95&w=120&h=120"
});
if (totalVols >= 20) badges.push({ 
  key: "Gold Volunteer", 
  title: "Gold Volunteer", 
  desc: "10+ events",
  image: "https://up.yimg.com/ib/th/id/OIP.M2jWfXFIT6yiFKdza-Xy9QHaHa?pid=Api&rs=1&c=1&qlt=95&w=121&h=121"
});

// Donor badges
if (donatedSum >= 200) badges.push({ 
  key: "Bronze Donor", 
  title: "Bronze Donor", 
  desc: "₹200+",
  image: "https://up.yimg.com/ib/th/id/OIP.OHs_yaTRMl1wF9glVaPZmgHaHa?pid=Api&rs=1&c=1&qlt=95&w=105&h=105"
});
if (donatedSum >= 1000) badges.push({ 
  key: "Silver Donor", 
  title: "Silver Donor", 
  desc: "₹1000+",
  image: "https://up.yimg.com/ib/th/id/OIP.8jVsS3Paqnphh1RUaZRO_gHaHa?pid=Api&rs=1&c=1&qlt=95&w=120&h=120"
});
if (donatedSum >= 3000) badges.push({ 
  key: "Gold Donor", 
  title: "Gold Donor", 
  desc: "₹3000+",
  image: "https://up.yimg.com/ib/th/id/OIP.M2jWfXFIT6yiFKdza-Xy9QHaHa?pid=Api&rs=1&c=1&qlt=95&w=121&h=121"
});
if (donatedSum >= 5000) badges.push({ 
  key: "Platinum Donor", 
  title: "Platinum Donor", 
  desc: "₹5000+",
  image: "https://tse3.mm.bing.net/th/id/OIP.Imd7GlakFy5b_od5xomrDAHaHa?pid=Api&P=0&h=180"
});


    // Save new badges to DB if not exists (unchanged)
    for (const b of badges) {
      const [exists] = await db.query("SELECT id FROM user_badges WHERE user_id=? AND badge_key=? LIMIT 1", [userId, b.key]);
      if (!exists.length) {
        await db.query(
          "INSERT INTO user_badges (user_id,badge_key,title,description,earned_at) VALUES (?,?,?,?,NOW())",
          [userId, b.key, b.title, b.desc]
        );
      }
    }

    res.json({ totalVols, donatedSum, badges });
  } catch (e) { 
    console.error("Achievement error:", e); 
    res.status(500).json({ message: "Server error" }); 
  }
});


// ---------------------- USER BADGES ----------------------
router.get("/user-badges", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT badge_key,title,description,earned_at FROM user_badges WHERE user_id=? ORDER BY earned_at DESC",
      [req.user.id]
    );
    res.json({ badges: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- NGO PROFILE + EVENTS (UPDATED TO INCLUDE PARTICIPATION) ----------------------
router.get("/ngo/:id", auth, async (req, res) => { // ADDED 'auth' middleware
    try {
        let id = Number(req.params.id);
        const userId = req.user.id; // Get the authenticated user's ID

        // if id is an event id, map to created_by (Existing logic remains the same)
        const [eventCheck] = await db.query("SELECT created_by FROM events WHERE id=?", [id]);
        if (eventCheck.length) id = eventCheck[0].created_by;

        const [ngoRows] = await db.query("SELECT id,name,email,points FROM users WHERE id=? AND role='NGO'", [id]);
        if (!ngoRows.length) return res.status(404).json({ message: "NGO not found" });
        
        const ngoId = id; // Final NGO ID

        // 1. Fetch User's Volunteer Records for this NGO
        const [volunteers] = await db.query(
            `SELECT v.id, e.title, v.created_at AS date
             FROM volunteers v
             JOIN events e ON v.event_id = e.id
             WHERE v.user_id = ? AND e.created_by = ?`,
            [userId, ngoId]
        );

        // 2. Fetch User's Donation Records for this NGO
        const [donations] = await db.query(
            `SELECT d.id, d.amount, d.created_at AS date
             FROM donations d
             WHERE d.user_id = ? AND d.ngo_id = ?`,
            [userId, ngoId]
        );
        
        // Return the NGO info along with the user's participation records
        res.json({ 
            ngo: ngoRows[0], 
            events: volunteers,   // Maps volunteer records to 'events' key for frontend consumption
            donations: donations  // Maps donation records to 'donations' key
        });
        
    } catch (e) { 
        console.error("NGO fetch error:", e); 
        res.status(500).json({ message: "Server error" }); 
    }
});

// ---------------------- MY NGOs ----------------------
router.get("/my-ngos", auth, async (req, res) => {
  try {
    const id = req.user.id;
    const [vol] = await db.query(
      `SELECT DISTINCT u.id,u.name,u.email 
        FROM users u 
        JOIN events e ON e.created_by=u.id 
        JOIN volunteers v ON v.event_id=e.id 
        WHERE v.user_id=?`,
      [id]
    );
    const [don] = await db.query(
      `SELECT DISTINCT u.id,u.name,u.email 
        FROM users u 
        JOIN donations d ON d.ngo_id=u.id 
        WHERE d.user_id=?`,
      [id]
    );
    const map = {};
    // This will correctly merge the results by NGO ID
    [...vol, ...don].forEach((x) => (map[x.id] = x));
    res.json({ ngos: Object.values(map) });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- DELETE NGO ----------------------
router.delete("/remove-ngo/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Forbidden" });
    const ngoId = Number(req.params.id);

    // remove volunteers tied to that NGO's events
    await db.query(`DELETE v FROM volunteers v JOIN events e ON v.event_id=e.id WHERE e.created_by=?`, [ngoId]);
    // remove donations tied to that NGO's events
    await db.query(`DELETE d FROM donations d JOIN events e ON d.event_id=e.id WHERE e.created_by=?`, [ngoId]);
    // remove donations where ngo_id points directly to ngo
    await db.query("DELETE FROM donations WHERE ngo_id=?", [ngoId]);
    // remove events
    await db.query("DELETE FROM events WHERE created_by=?", [ngoId]);

    const [result] = await db.query("DELETE FROM users WHERE id=? AND role='NGO'", [ngoId]);
    if (!result.affectedRows) return res.status(404).json({ message: "NGO not found" });
    res.json({ message: "NGO removed successfully" });
  } catch (e) { console.error("NGO delete error:", e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- NGO VOLUNTEERS ----------------------
router.get("/ngo/volunteers", auth, async (req, res) => {
  try {
    const ngoId = req.user.id;
    const [rows] = await db.query(
      `SELECT v.id,v.created_at,u.name AS user_name,u.email AS user_email,e.title AS event_title,e.id AS event_id 
        FROM volunteers v 
        JOIN events e ON v.event_id=e.id 
        JOIN users u ON v.user_id=u.id 
        WHERE e.created_by=? 
        ORDER BY v.created_at DESC`,
      [ngoId]
    );
    res.json({ volunteers: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- NGO DONATIONS ----------------------
router.get("/ngo/donations", auth, async (req, res) => {
  try {
    const ngoId = req.user.id;
    const [rows] = await db.query(
      `SELECT d.id,d.amount,d.created_at,u.name AS donor_name,u.email AS donor_email,e.title AS event_title 
        FROM donations d 
        LEFT JOIN users u ON d.user_id=u.id 
        LEFT JOIN events e ON d.event_id=e.id 
        WHERE d.ngo_id=? OR e.created_by=? 
        ORDER BY d.created_at DESC`,
      [ngoId, ngoId]
    );
    res.json({ donations: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- NGO ACHIEVEMENTS ----------------------
router.get("/ngo/achievements", auth, async (req, res) => {
  try {
    const ngoId = req.user.id;
    const [[totals]] = await db.query(
      `SELECT 
           (SELECT COUNT(*) FROM events WHERE created_by=?) AS totalEvents,
           (SELECT COUNT(*) FROM volunteers v JOIN events e ON v.event_id=e.id WHERE e.created_by=?) AS totalVolunteers,
           (SELECT IFNULL(SUM(amount),0) FROM donations WHERE ngo_id=?) AS totalDonations`,
      [ngoId, ngoId, ngoId]
    );

    const [topEvents] = await db.query(
      `SELECT e.id,e.title,e.image_url,COUNT(v.id) AS volunteers_count 
        FROM events e 
        LEFT JOIN volunteers v ON v.event_id=e.id 
        WHERE e.created_by=? 
        GROUP BY e.id 
        ORDER BY volunteers_count DESC 
        LIMIT 5`,
      [ngoId]
    );

    res.json({ totals, topEvents, successfulEvents: topEvents.length });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- NGO PARTICIPANTS ----------------------
router.get("/ngo/participants", auth, async (req, res) => {
  try {
    const ngoId = req.user.id;
    const [rows] = await db.query(
      `SELECT v.id,u.name AS user_name,u.email AS user_email,e.id AS event_id,e.title AS event_title 
        FROM volunteers v 
        JOIN events e ON v.event_id=e.id 
        JOIN users u ON v.user_id=u.id 
        WHERE e.created_by=? 
        ORDER BY v.created_at DESC`,
      [ngoId]
    );
    res.json({ participants: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- TOP VOLUNTEERS ----------------------
router.get("/top-volunteers", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Forbidden" });
    // Get ALL volunteers sorted by event count (highest first)
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, COUNT(v.id) AS total 
        FROM volunteers v 
        JOIN users u ON v.user_id = u.id 
        GROUP BY u.id 
        ORDER BY total DESC`
    );
    res.json({ top: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- TOP DONORS ----------------------
router.get("/top-donors", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Forbidden" });
    // Get ALL donors sorted by total donation amount (highest first)
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.email, SUM(d.amount) AS total 
        FROM donations d 
        JOIN users u ON d.user_id = u.id 
        GROUP BY u.id 
        ORDER BY total DESC`
    );
    res.json({ top: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- BADGES (ADMIN VIEW) ----------------------
router.get("/badges", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Forbidden" });
    const [rows] = await db.query(`
      SELECT u.id, u.name, u.email, ub.badge_key as \`key\`, ub.title as badge_name, ub.description, ub.earned_at
      FROM user_badges ub
      JOIN users u ON ub.user_id = u.id
      ORDER BY u.name, ub.earned_at DESC
    `);
    res.json({ badges: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- MOST ACTIVE NGO ----------------------
router.get("/most-active-ngo", async (req, res) => {
  try {
    const [result] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        IFNULL(ev.event_count, 0) AS events_created,
        IFNULL(vol.volunteer_count, 0) AS volunteers_in_events,
        IFNULL(don.total_donations, 0) AS donations_received,
        GREATEST(
          IFNULL(ev.latest_event_date, '1970-01-01'),
          IFNULL(vol.latest_volunteer_date, '1970-01-01'),
          IFNULL(don.latest_donation_date, '1970-01-01')
        ) AS last_activity_date,
        (
          IFNULL(ev.event_count,0) + 
          IFNULL(vol.volunteer_count,0) + 
          IFNULL(don.total_donations,0)
        ) AS activity_score
      FROM users u
      LEFT JOIN (
        SELECT created_by AS ngo_id, COUNT(*) AS event_count, MAX(created_at) AS latest_event_date
        FROM events
        GROUP BY created_by
      ) ev ON u.id = ev.ngo_id
      LEFT JOIN (
        SELECT e.created_by AS ngo_id, COUNT(v.id) AS volunteer_count, MAX(v.created_at) AS latest_volunteer_date
        FROM volunteers v
        JOIN events e ON v.event_id = e.id
        GROUP BY e.created_by
      ) vol ON u.id = vol.ngo_id
      LEFT JOIN (
        SELECT ngo_id, SUM(amount) AS total_donations, MAX(created_at) AS latest_donation_date
        FROM donations
        GROUP BY ngo_id
      ) don ON u.id = don.ngo_id
      WHERE u.role = 'NGO'
      ORDER BY activity_score DESC
      LIMIT 1
    `);

    res.json({ top: result[0] || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching most active NGO" });
  }
});

// ---------------------- NGO MINI PROFILE ----------------------
router.get("/ngo/info", auth, async (req, res) => {
  try {
    if (req.user.role !== "NGO") return res.status(403).json({ message: "Forbidden" });
    const ngoId = req.user.id;
    const [[info]] = await db.query(`SELECT id, name, email, role FROM users WHERE id=? AND role='NGO' LIMIT 1`, [ngoId]);
    if (!info) return res.status(404).json({ message: "NGO not found" });
    const [[count]] = await db.query(`SELECT COUNT(*) AS totalEvents FROM events WHERE created_by=?`, [ngoId]);
    res.json({ ...info, totalEvents: count.totalEvents });
  } catch (err) { console.error("NGO info route error:", err); res.status(500).json({ message: "Server error" }); }
});

// ---------------------- BADGES WITH USERS (ADMIN) ----------------------
router.get("/badges-with-users", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") 
      return res.status(403).json({ message: "Forbidden" });

    const [rows] = await db.query(`
      SELECT 
        ub.badge_key AS \`key\`,
        ub.title,
        ub.description,
        ub.earned_at,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email
      FROM user_badges ub
      JOIN users u ON ub.user_id = u.id
      ORDER BY ub.earned_at DESC
    `);

    res.json({ badges: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------- DELETE USER (ADMIN ONLY) ----------------------
router.delete("/delete-user/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Forbidden - Admin only" });
    
    const userId = Number(req.params.id);
    
    if (userId === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }

    console.log(`Admin deleting user ${userId}`);

    // Delete all related data in cascade order
    // 1. Delete volunteers (cascade through event)
    await db.query("DELETE FROM volunteers WHERE user_id = ?", [userId]);
    
    // 2. Delete donations
    await db.query("DELETE FROM donations WHERE user_id = ?", [userId]);
    
    // 3. Delete feedback
    await db.query("DELETE FROM feedback WHERE user_id = ?", [userId]);
    
    // 4. Delete user badges
    await db.query("DELETE FROM user_badges WHERE user_id = ?", [userId]);
    
    // 5. Delete user achievements
    await db.query("DELETE FROM user_achievements WHERE user_id = ?", [userId]);
    
    // 6. Delete events created by user (cascade delete volunteers/donations/feedback for those events)
    const [[eventInfo]] = await db.query("SELECT id FROM events WHERE created_by = ? LIMIT 1", [userId]);
    if (eventInfo) {
      const [events] = await db.query("SELECT id FROM events WHERE created_by = ?", [userId]);
      for (const event of events) {
        await db.query("DELETE FROM volunteers WHERE event_id = ?", [event.id]);
        await db.query("DELETE FROM donations WHERE event_id = ?", [event.id]);
        await db.query("DELETE FROM feedback WHERE event_id = ?", [event.id]);
        await db.query("DELETE FROM event_activity WHERE event_id = ?", [event.id]);
      }
      await db.query("DELETE FROM events WHERE created_by = ?", [userId]);
    }
    
    // 7. Delete the user itself
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [userId]);
    
    if (!result.affectedRows) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully with all related data" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ---------------------- DELETE EVENT (ADMIN ONLY) ----------------------
router.delete("/delete-event/:id", auth, async (req, res) => {
  try {
    if (req.user.role !== "Admin") return res.status(403).json({ message: "Forbidden - Admin only" });
    
    const eventId = Number(req.params.id);

    console.log(`Admin deleting event ${eventId}`);

    // Verify event exists
    const [[event]] = await db.query("SELECT id FROM events WHERE id = ?", [eventId]);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Delete all related data in cascade order
    // 1. Delete volunteers
    await db.query("DELETE FROM volunteers WHERE event_id = ?", [eventId]);
    
    // 2. Delete donations
    await db.query("DELETE FROM donations WHERE event_id = ?", [eventId]);
    
    // 3. Delete feedback
    await db.query("DELETE FROM feedback WHERE event_id = ?", [eventId]);
    
    // 4. Delete event activity
    await db.query("DELETE FROM event_activity WHERE event_id = ?", [eventId]);
    
    // 5. Delete the event itself
    await db.query("DELETE FROM events WHERE id = ?", [eventId]);

    res.json({ message: "Event deleted successfully with all related data" });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;
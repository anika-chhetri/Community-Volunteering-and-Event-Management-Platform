const express = require('express');
const router = express.Router();

// Simple rule-based chatbot. Frontend sends {message}
router.post('/', (req,res)=>{
  const { message } = req.body;
  const m = (message||'').toLowerCase();
  // quick rules
  if (m.includes('hello')||m.includes('hi')) return res.json({reply:'Hello! How can I help you today?', buttons:[{key:'events',label:'Events'},{key:'volunteer',label:'Volunteer'},{key:'donate',label:'Donate'},{key:'contact',label:'Contact Us'}]});
  if (m.includes('events')) return res.json({reply:'You can see upcoming events on the Events page.', buttons:[{key:'events',label:'Events'}]});
  if (m.includes('donate')) return res.json({reply:'Thank you! You can donate from your dashboard.', buttons:[{key:'donate',label:'Donate'}]});
  if (m.includes('volunt')||m.includes('help')) return res.json({reply:'You can sign up for volunteering in the Events page or via your dashboard.', buttons:[{key:'volunteer',label:'Volunteer'}]});
  return res.json({reply:'Sorry, I did not understand. Try: "events", "donate", or "volunteer"', buttons:[{key:'events',label:'Events'},{key:'donate',label:'Donate'},{key:'volunteer',label:'Volunteer'}]});
});

module.exports = router;

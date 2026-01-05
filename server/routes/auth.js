const express = require("express");
const { admin } = require("../firebaseAdmin");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();

router.get("/email-exists", requireAuth, async (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "email is required" });

  try {
    await admin.auth().getUserByEmail(email);
    return res.json({ exists: true });
  } catch (e) {
    if (e?.code === "auth/user-not-found") return res.json({ exists: false });
    return res.status(500).json({ error: "Failed to check email" });
  }
});

module.exports = router;

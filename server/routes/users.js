const express = require("express");
const { db, admin } = require("../firebaseAdmin");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router();


router.post("/me/ensure", requireAuth, async (req, res) => {
  const { uid, email } = req.user;
  const displayName = (req.body?.displayName || "").trim() || null;

  const ref = db.collection("users").doc(uid);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);

    if (!snap.exists) {
      tx.set(ref, {
        uid,
        email,
        displayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (displayName) {
      tx.update(ref, { displayName });
    }
  });

  const updated = await ref.get();
  return res.json({ user: updated.data() });
});


router.get("/me", requireAuth, async (req, res) => {
  const ref = db.collection("users").doc(req.user.uid);
  const snap = await ref.get();

  if (!snap.exists) {
    return res.status(404).json({ error: "Profile not found" });
  }

  return res.json({ user: snap.data() });
});

module.exports = router;
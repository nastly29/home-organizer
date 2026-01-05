const express = require("express");
const { db, admin } = require("../firebaseAdmin");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router({ mergeParams: true });

async function ensureTeamMember(teamId, uid) {
  const snap = await db
    .collection("users")
    .doc(uid)
    .collection("teams")
    .doc(teamId)
    .get();
  return snap.exists;
}

async function getItem(teamId, itemId) {
  const ref = db.collection("teams").doc(teamId).collection("shopping").doc(itemId);
  const snap = await ref.get();
  return { ref, snap };
}

// отримати покупки
router.get("/", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  try {
    const ok = await ensureTeamMember(teamId, uid);
    if (!ok) return res.status(403).json({ error: "NOT_A_MEMBER" });

    const category = String(req.query?.category || "all").trim();
    const col = db.collection("teams").doc(teamId).collection("shopping");

    let snap;
    if (!category || category === "all") {
      snap = await col.orderBy("createdAt", "desc").get();
    } else {
      snap = await col.where("category", "==", category).get();
    }

    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a?.createdAt?.toMillis?.() ? a.createdAt.toMillis() : 0;
        const tb = b?.createdAt?.toMillis?.() ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });

    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// створити покупку
router.post("/", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  try {
    const ok = await ensureTeamMember(teamId, uid);
    if (!ok) return res.status(403).json({ error: "NOT_A_MEMBER" });

    const title = String(req.body?.title || "").trim();
    if (title.length < 2) return res.status(400).json({ error: "TITLE_REQUIRED" });

    const category = String(req.body?.category || "other").trim() || "other";
    const note = String(req.body?.note || "").trim();

    const qtyValueRaw = req.body?.qtyValue;
    const qtyValue =
      typeof qtyValueRaw === "number" && Number.isFinite(qtyValueRaw) && qtyValueRaw > 0
        ? qtyValueRaw
        : null;

    const qtyUnit = qtyValue ? String(req.body?.qtyUnit || "").trim() : "";

    const ref = db.collection("teams").doc(teamId).collection("shopping").doc();

    await ref.set({
      title,
      category,
      note,
      qtyValue,
      qtyUnit,
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const snap = await ref.get();
    return res.status(201).json({ item: { id: snap.id, ...snap.data() } });
  } catch (e) {
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// змінити покупку
router.patch("/:itemId", requireAuth, async (req, res) => {
  const { teamId, itemId } = req.params;
  const uid = req.user.uid;

  try {
    const ok = await ensureTeamMember(teamId, uid);
    if (!ok) return res.status(403).json({ error: "NOT_A_MEMBER" });

    const { ref, snap } = await getItem(teamId, itemId);
    if (!snap.exists) return res.status(404).json({ error: "NOT_FOUND" });

    const data = snap.data() || {};
    if (data.createdBy !== uid) return res.status(403).json({ error: "NOT_AUTHOR" });

    const title = String(req.body?.title || "").trim();
    if (title.length < 2) return res.status(400).json({ error: "TITLE_REQUIRED" });

    const category = String(req.body?.category || "other").trim() || "other";
    const note = String(req.body?.note || "").trim();

    const qtyValueRaw = req.body?.qtyValue;
    const qtyValue =
      typeof qtyValueRaw === "number" && Number.isFinite(qtyValueRaw) && qtyValueRaw > 0
        ? qtyValueRaw
        : null;

    const qtyUnit = qtyValue ? String(req.body?.qtyUnit || "").trim() : "";

    await ref.update({
      title,
      category,
      note,
      qtyValue,
      qtyUnit,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updated = await ref.get();
    return res.json({ item: { id: updated.id, ...updated.data() } });
  } catch (e) {
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// підтвердити покупку
router.post("/:itemId/confirm", requireAuth, async (req, res) => {
  const { teamId, itemId } = req.params;
  const uid = req.user.uid;

  try {
    const ok = await ensureTeamMember(teamId, uid);
    if (!ok) return res.status(403).json({ error: "NOT_A_MEMBER" });

    await db.collection("teams").doc(teamId).collection("shopping").doc(itemId).delete();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// видалити покупку
router.delete("/:itemId", requireAuth, async (req, res) => {
  const { teamId, itemId } = req.params;
  const uid = req.user.uid;

  try {
    const ok = await ensureTeamMember(teamId, uid);
    if (!ok) return res.status(403).json({ error: "NOT_A_MEMBER" });

    const { ref, snap } = await getItem(teamId, itemId);
    if (!snap.exists) return res.status(404).json({ error: "NOT_FOUND" });

    const data = snap.data() || {};
    if (data.createdBy !== uid) return res.status(403).json({ error: "NOT_AUTHOR" });

    await ref.delete();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

module.exports = router;
const express = require("express");
const { db, admin } = require("../firebaseAdmin");
const { requireAuth } = require("../middleware/requireAuth");

const router = express.Router({ mergeParams: true });

async function assertTeamMember(teamId, uid) {
  const linkSnap = await db.collection("users").doc(uid).collection("teams").doc(teamId).get();
  if (!linkSnap.exists) {
    const err = new Error("NOT_A_MEMBER");
    err.code = "NOT_A_MEMBER";
    throw err;
  }
}

function eventToJson(doc) {
  const d = doc.data() || {};
  return {
    id: doc.id,
    title: d.title || "",
    date: d.date || "",      
    time: d.time || "",     
    place: d.place || "",
    note: d.note || "",
    createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : null,
    updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : null,
  };
}

function getMonthRange(monthStr) {
  const m = String(monthStr || "").trim();
  if (!/^\d{4}-\d{2}$/.test(m)) return null;

  const [yy, mm] = m.split("-").map((x) => Number(x));
  const start = new Date(Date.UTC(yy, mm - 1, 1));
  const end = new Date(Date.UTC(yy, mm, 0)); 

  const pad = (n) => String(n).padStart(2, "0");
  const startStr = `${yy}-${pad(mm)}-01`;
  const endStr = `${yy}-${pad(mm)}-${pad(end.getUTCDate())}`;

  return { startStr, endStr };
}

// отримати події
router.get("/", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  try {
    await assertTeamMember(teamId, uid);

    const month = String(req.query?.month || "").trim();
    const range = getMonthRange(month);
    if (!range) return res.status(400).json({ error: "MONTH_REQUIRED_YYYY_MM" });

    const ref = db.collection("teams").doc(teamId).collection("events");

    const snap = await ref
      .where("date", ">=", range.startStr)
      .where("date", "<=", range.endStr)
      .orderBy("date", "asc")
      .orderBy("time", "asc")
      .get();

    return res.json({ events: snap.docs.map(eventToJson) });
  } catch (e) {
    console.error("[events:list]", e);
    const msg = String(e?.message || "");
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") return res.status(403).json({ error: "NOT_A_MEMBER" });
    return res.status(500).json({ error: "INTERNAL_ERROR", details: msg });
  }
});

// створити подію
router.post("/", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  const title = String(req.body?.title || "").trim();
  const date = String(req.body?.date || "").trim(); 
  const time = String(req.body?.time || "").trim(); 
  const place = String(req.body?.place || "").trim();
  const note = String(req.body?.note || "").trim();

  if (title.length < 2) return res.status(400).json({ error: "TITLE_TOO_SHORT" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "DATE_REQUIRED_YYYY_MM_DD" });
  if (time && !/^\d{2}:\d{2}$/.test(time)) return res.status(400).json({ error: "TIME_INVALID" });

  try {
    await assertTeamMember(teamId, uid);

    const ref = db.collection("teams").doc(teamId).collection("events").doc();
    await ref.set({
      title,
      date,
      time: time || "",   
      place,
      note,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const created = await ref.get();
    return res.status(201).json({ event: eventToJson(created) });
  } catch (e) {
    console.error("[events:create]", e);
    const msg = String(e?.message || "");
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") return res.status(403).json({ error: "NOT_A_MEMBER" });
    return res.status(500).json({ error: "INTERNAL_ERROR", details: msg });
  }
});

// змінити подію
router.patch("/:eventId", requireAuth, async (req, res) => {
  const { teamId, eventId } = req.params;
  const uid = req.user.uid;

  const title = String(req.body?.title || "").trim();
  const date = String(req.body?.date || "").trim();
  const time = String(req.body?.time || "").trim();
  const place = String(req.body?.place || "").trim();
  const note = String(req.body?.note || "").trim();

  if (title.length < 2) return res.status(400).json({ error: "TITLE_TOO_SHORT" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: "DATE_REQUIRED_YYYY_MM_DD" });
  if (time && !/^\d{2}:\d{2}$/.test(time)) return res.status(400).json({ error: "TIME_INVALID" });

  try {
    await assertTeamMember(teamId, uid);

    const ref = db.collection("teams").doc(teamId).collection("events").doc(eventId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("EVENT_NOT_FOUND");

      tx.update(ref, {
        title,
        date,
        time: time || "",
        place,
        note,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    const updated = await ref.get();
    return res.json({ event: eventToJson(updated) });
  } catch (e) {
    console.error("[events:update]", e);
    const msg = String(e?.message || "");
    if (msg === "EVENT_NOT_FOUND") return res.status(404).json({ error: "EVENT_NOT_FOUND" });
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") return res.status(403).json({ error: "NOT_A_MEMBER" });
    return res.status(500).json({ error: "INTERNAL_ERROR", details: msg });
  }
});

// видалити подію
router.delete("/:eventId", requireAuth, async (req, res) => {
  const { teamId, eventId } = req.params;
  const uid = req.user.uid;

  try {
    await assertTeamMember(teamId, uid);

    const ref = db.collection("teams").doc(teamId).collection("events").doc(eventId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("EVENT_NOT_FOUND");
      tx.delete(ref);
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("[events:delete]", e);
    const msg = String(e?.message || "");
    if (msg === "EVENT_NOT_FOUND") return res.status(404).json({ error: "EVENT_NOT_FOUND" });
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") return res.status(403).json({ error: "NOT_A_MEMBER" });
    return res.status(500).json({ error: "INTERNAL_ERROR", details: msg });
  }
});

module.exports = router;
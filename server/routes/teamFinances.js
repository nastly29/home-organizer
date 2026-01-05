const express = require("express");
const router = express.Router({ mergeParams: true });

const firebaseAdmin = require("../firebaseAdmin");
const { admin, db } = firebaseAdmin;

const requireAuthImport = require("../middleware/requireAuth");
const requireAuth =
  typeof requireAuthImport === "function"
    ? requireAuthImport
    : requireAuthImport.requireAuth;

// helpers
async function assertTeamMember(teamId, uid) {
  const linkSnap = await db
    .collection("users")
    .doc(uid)
    .collection("teams")
    .doc(teamId)
    .get();

  if (!linkSnap.exists) {
    const err = new Error("NOT_A_MEMBER");
    err.code = "NOT_A_MEMBER";
    throw err;
  }
}

async function isMember(teamId, uid) {
  const snap = await db.collection("teams").doc(teamId).collection("members").doc(uid).get();
  return snap.exists;
}

function toIso(ts) {
  return ts?.toDate ? ts.toDate().toISOString() : null;
}

function parseSpentAt(admin, spentDate) {
  const d = String(spentDate || "").trim();
  if (!d) return null;

  const ms = Date.parse(`${d}T00:00:00`);
  if (Number.isNaN(ms)) return null;

  return admin.firestore.Timestamp.fromDate(new Date(ms));
}

function financesRef(teamId) {
  return db.collection("teams").doc(teamId).collection("finances");
}

function financeToJson(doc) {
  const d = doc.data() || {};
  return {
    id: doc.id,
    spenderUid: d.spenderUid || "",
    spentDate: d.spentDate || "",
    spentAt: toIso(d.spentAt),

    amount: typeof d.amount === "number" ? d.amount : 0,
    note: d.note || "",

    createdBy: d.createdBy || "",
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
  };
}

// отримати витрати
router.get("/", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;
  const filter = String(req.query?.filter || "all");

  try {
    await assertTeamMember(teamId, uid);

    const ref = financesRef(teamId);
    let q = ref;

    if (filter === "mine") {
      q = q.where("spenderUid", "==", uid);
    }
    q = q.orderBy("spentAt", "desc");

    const snap = await q.get();
    const items = snap.docs.map(financeToJson);

    return res.json({ items });
  } catch (e) {
    console.error("[finances:list]", e);
    const msg = String(e?.message || "");
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") {
      return res.status(403).json({ error: "NOT_A_MEMBER" });
    }

    if (msg.includes("FAILED_PRECONDITION") || msg.includes("requires an index")) {
      return res.status(400).json({ error: "INDEX_REQUIRED" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// створити витрату
router.post("/", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  const spenderUid = String(req.body?.spenderUid || "").trim();
  const spentDate = String(req.body?.spentDate || "").trim();
  const note = String(req.body?.note || "").trim();

  const amountRaw = req.body?.amount;
  const amount = typeof amountRaw === "number" ? amountRaw : Number(String(amountRaw || "").replace(",", "."));

  if (!spenderUid) return res.status(400).json({ error: "SPENDER_REQUIRED" });
  if (!spentDate) return res.status(400).json({ error: "DATE_REQUIRED" });
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "AMOUNT_INVALID" });

  try {
    await assertTeamMember(teamId, uid);

    const spenderIsMember = await isMember(teamId, spenderUid);
    if (!spenderIsMember) return res.status(400).json({ error: "SPENDER_NOT_MEMBER" });

    const spentAt = parseSpentAt(admin, spentDate);
    if (!spentAt) return res.status(400).json({ error: "DATE_INVALID" });

    const docRef = financesRef(teamId).doc();
    await docRef.set({
      spenderUid,
      spentDate,
      spentAt,

      amount,
      note: note || "",

      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const snap = await docRef.get();
    return res.status(201).json({ item: financeToJson(snap) });
  } catch (e) {
    console.error("[finances:create]", e);
    const msg = String(e?.message || "");
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") {
      return res.status(403).json({ error: "NOT_A_MEMBER" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// змінити витрату
router.patch("/:itemId", requireAuth, async (req, res) => {
  const { teamId, itemId } = req.params;
  const uid = req.user?.uid;

  const { spentDate, amount, note, spenderUid } = req.body || {};

  try {
    if (!teamId || !itemId) return res.status(400).json({ error: "BAD_REQUEST" });

    const ref = db
      .collection("teams")
      .doc(teamId)
      .collection("finances")
      .doc(itemId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("ITEM_NOT_FOUND");

      const data = snap.data() || {};
      const spenderUidCurrent = String(data.spenderUid || "");

      if (spenderUidCurrent !== uid) throw new Error("FORBIDDEN");
      if (spenderUid !== undefined) {
        throw new Error("SPENDER_CHANGE_FORBIDDEN");
      }

      const patch = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (spentDate !== undefined) {
        const d = String(spentDate || "").trim();
        if (!d) throw new Error("DATE_REQUIRED");

        const spentAt = parseSpentAt(admin, d);
        if (!spentAt) throw new Error("DATE_INVALID");

        patch.spentDate = d;
        patch.spentAt = spentAt;
      }

      if (amount !== undefined) {
        const n =
          typeof amount === "number"
            ? amount
            : Number(String(amount || "").replace(",", "."));

        if (!Number.isFinite(n) || n <= 0) throw new Error("AMOUNT_INVALID");
        patch.amount = n;
      }

      if (note !== undefined) {
        patch.note = String(note || "").trim();
      }

      tx.update(ref, patch);
    });

    return res.json({ ok: true });
  } catch (e) {
    const msg = String(e?.message || "INTERNAL_ERROR");

    if (msg === "ITEM_NOT_FOUND") return res.status(404).json({ error: "ITEM_NOT_FOUND" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "ONLY_SPENDER_CAN_EDIT" });
    if (msg === "SPENDER_CHANGE_FORBIDDEN") return res.status(403).json({ error: "SPENDER_CHANGE_FORBIDDEN" });
    if (msg === "DATE_REQUIRED") return res.status(400).json({ error: "DATE_REQUIRED" });
    if (msg === "DATE_INVALID") return res.status(400).json({ error: "DATE_INVALID" });
    if (msg === "AMOUNT_INVALID") return res.status(400).json({ error: "AMOUNT_INVALID" });

    console.error("[FINANCES_PATCH]", { teamId, itemId, uid, msg, body: req.body, stack: e?.stack });
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// видалити витрату
router.delete("/:itemId", requireAuth, async (req, res) => {
  const { teamId, itemId } = req.params;
  const uid = req.user.uid;

  try {
    await assertTeamMember(teamId, uid);

    const ref = financesRef(teamId).doc(itemId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("ITEM_NOT_FOUND");

      const data = snap.data() || {};
      const spenderUidCurrent = String(data.spenderUid || "");
      if (spenderUidCurrent !== uid) throw new Error("FORBIDDEN");
      tx.delete(ref);
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("[finances:delete]", e);
    const msg = String(e?.message || "");
    if (msg === "ITEM_NOT_FOUND") return res.status(404).json({ error: "ITEM_NOT_FOUND" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "ONLY_SPENDER_CAN_DELETE" });
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") return res.status(403).json({ error: "NOT_A_MEMBER" });
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

module.exports = router;
const express = require("express");
const { db, admin } = require("../firebaseAdmin");
const { requireAuth } = require("../middleware/requireAuth");

const teamTasksRouter = require("./teamTasks");
const teamShopping = require("./teamShopping");
const teamFinances = require("./teamFinances");
const teamEventsRouter = require("./teamEvents");

const router = express.Router();

// створити команду
router.post("/", requireAuth, async (req, res) => {
  const name = (req.body?.name || "").trim();
  if (name.length < 2) {
    return res.status(400).json({ error: "Team name must be at least 2 characters" });
  }

  const uid = req.user.uid;

  const teamRef = db.collection("teams").doc();
  const memberRef = teamRef.collection("members").doc(uid);
  const userTeamRef = db.collection("users").doc(uid).collection("teams").doc(teamRef.id);

  await db.runTransaction(async (tx) => {
    tx.set(teamRef, {
      name,
      ownerId: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      membersCount: 1, 
    });

    tx.set(memberRef, {
      uid,
      role: "owner",
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    tx.set(userTeamRef, {
      teamId: teamRef.id,
      role: "owner",
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  const teamSnap = await teamRef.get();
  return res.status(201).json({ team: { id: teamRef.id, ...teamSnap.data() } });
});

// отримати команди
router.get("/", requireAuth, async (req, res) => {
  const uid = req.user.uid;

  const userTeamsSnap = await db.collection("users").doc(uid).collection("teams").get();

  const links = userTeamsSnap.docs.map((d) => ({
    teamId: d.id,
    ...d.data(),
  }));

  if (links.length === 0) return res.json({ teams: [] });

  const teamIds = links.map((l) => l.teamId);
  const chunks = [];
  for (let i = 0; i < teamIds.length; i += 10) chunks.push(teamIds.slice(i, i + 10));

  const teamMap = new Map();
  for (const chunk of chunks) {
    const snap = await db
      .collection("teams")
      .where(admin.firestore.FieldPath.documentId(), "in", chunk)
      .get();

    snap.forEach((doc) => {
      teamMap.set(doc.id, { id: doc.id, ...doc.data() });
    });
  }

  const teams = links
    .map((l) => {
      const team = teamMap.get(l.teamId);
      if (!team) return null;
      return { ...team, role: l.role || "member" };
    })
    .filter(Boolean);

  return res.json({ teams });
});

// отримати команду
router.get("/:teamId", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  const linkSnap = await db.collection("users").doc(uid).collection("teams").doc(teamId).get();
  if (!linkSnap.exists) return res.status(403).json({ error: "Not a team member" });

  const teamSnap = await db.collection("teams").doc(teamId).get();
  if (!teamSnap.exists) return res.status(404).json({ error: "Team not found" });

  return res.json({
    team: { id: teamSnap.id, ...teamSnap.data() },
    membership: { uid, ...linkSnap.data() },
  });
});

// отримати учасників команди
router.get("/:teamId/members", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  const linkSnap = await db.collection("users").doc(uid).collection("teams").doc(teamId).get();
  if (!linkSnap.exists) return res.status(403).json({ error: "Not a team member" });

  const membersSnap = await db.collection("teams").doc(teamId).collection("members").get();
  const members = membersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));

  const ids = members.map((m) => m.uid);
  const chunks = [];
  for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

  const userMap = new Map();
  for (const chunk of chunks) {
    const snap = await db
      .collection("users")
      .where(admin.firestore.FieldPath.documentId(), "in", chunk)
      .get();
    snap.forEach((doc) => userMap.set(doc.id, doc.data()));
  }

  const result = members.map((m) => {
    const u = userMap.get(m.uid) || {};
    return {
      uid: m.uid,
      role: m.role || "member",
      displayName: u.displayName || "",
      email: u.email || "",
    };
  });

  return res.json({ members: result });
});

// приєднати до групи
router.post("/join", requireAuth, async (req, res) => {
  const teamId = (req.body?.teamId || "").trim();
  if (!teamId) return res.status(400).json({ error: "TEAM_ID_REQUIRED" });

  const uid = req.user.uid;

  const teamRef = db.collection("teams").doc(teamId);
  const memberRef = teamRef.collection("members").doc(uid);
  const userTeamRef = db.collection("users").doc(uid).collection("teams").doc(teamId);

  try {
    await db.runTransaction(async (tx) => {
      const teamSnap = await tx.get(teamRef);
      if (!teamSnap.exists) {
        const err = new Error("TEAM_NOT_FOUND");
        err.code = "TEAM_NOT_FOUND";
        throw err;
      }

      const linkSnap = await tx.get(userTeamRef);
      if (linkSnap.exists) return;

      tx.set(memberRef, {
        uid,
        role: "member",
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.set(userTeamRef, {
        teamId,
        role: "member",
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      tx.update(teamRef, {
        membersCount: admin.firestore.FieldValue.increment(1),
      });
    });

    const teamSnap = await teamRef.get();
    return res.json({ team: { id: teamSnap.id, ...teamSnap.data() } });
  } catch (e) {
    const code = e?.code || e?.message;

    if (code === "TEAM_NOT_FOUND") {
      return res.status(404).json({ error: "TEAM_NOT_FOUND" });
    }

    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

// покинути групу
router.post("/:teamId/leave", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  const teamRef = db.collection("teams").doc(teamId);
  const memberRef = teamRef.collection("members").doc(uid);
  const userTeamRef = db.collection("users").doc(uid).collection("teams").doc(teamId);

  await db.runTransaction(async (tx) => {
    const linkSnap = await tx.get(userTeamRef);
    if (!linkSnap.exists) throw new Error("NOT_MEMBER");

    const role = linkSnap.data()?.role || "member";
    if (role === "owner") {
      throw new Error("OWNER_CANT_LEAVE");
    }

    tx.delete(memberRef);
    tx.delete(userTeamRef);
    tx.update(teamRef, {
      membersCount: admin.firestore.FieldValue.increment(-1),
    });
  });

  return res.json({ ok: true });
});

// редагувати команду
router.patch("/:teamId", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  const name = (req.body?.name || "").trim();
  if (name.length < 2) {
    return res.status(400).json({ error: "Team name must be at least 2 characters" });
  }

  try {
    const teamRef = db.collection("teams").doc(teamId);
    const linkRef = db.collection("users").doc(uid).collection("teams").doc(teamId);

    await db.runTransaction(async (tx) => {
      const [teamSnap, linkSnap] = await Promise.all([tx.get(teamRef), tx.get(linkRef)]);

      if (!teamSnap.exists) throw new Error("TEAM_NOT_FOUND");
      if (!linkSnap.exists) throw new Error("NOT_A_MEMBER");

      const role = linkSnap.data()?.role;
      if (role !== "owner") throw new Error("FORBIDDEN");

      tx.update(teamRef, {
        name,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    const updated = await db.collection("teams").doc(teamId).get();
    return res.json({ team: { id: updated.id, ...updated.data() } });
  } catch (e) {
    const msg = e?.message || "";
    if (msg === "TEAM_NOT_FOUND") return res.status(404).json({ error: "Team not found" });
    if (msg === "NOT_A_MEMBER") return res.status(403).json({ error: "Not a team member" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "Only owner can edit team name" });
    return res.status(500).json({ error: "Internal server error" });
  }
});


// видалити команду
router.delete("/:teamId", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  try {
    const teamRef = db.collection("teams").doc(teamId);
    const linkRef = db.collection("users").doc(uid).collection("teams").doc(teamId);

    const [teamSnap, linkSnap] = await Promise.all([teamRef.get(), linkRef.get()]);
    if (!teamSnap.exists) return res.status(404).json({ error: "Team not found" });
    if (!linkSnap.exists) return res.status(403).json({ error: "Not a team member" });

    const role = linkSnap.data()?.role;
    if (role !== "owner") return res.status(403).json({ error: "Only owner can delete the team" });

    const membersSnap = await teamRef.collection("members").get();
    const memberUids = membersSnap.docs.map((d) => d.id);

    const chunkSize = 400;
    for (let i = 0; i < memberUids.length; i += chunkSize) {
      const chunk = memberUids.slice(i, i + chunkSize);
      const batch = db.batch();
      for (const memberUid of chunk) {
        const ref = db.collection("users").doc(memberUid).collection("teams").doc(teamId);
        batch.delete(ref);
      }
      await batch.commit();
    }
    await db.recursiveDelete(teamRef);

    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Internal server error" });
  }
});

// передати права власника
router.post("/:teamId/transfer-owner", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  const newOwnerUid = (req.body?.newOwnerUid || "").trim();
  if (!newOwnerUid) return res.status(400).json({ error: "newOwnerUid is required" });
  if (newOwnerUid === uid) return res.status(400).json({ error: "Cannot transfer ownership to yourself" });

  try {
    const teamRef = db.collection("teams").doc(teamId);

    const currentLinkRef = db.collection("users").doc(uid).collection("teams").doc(teamId);
    const newOwnerLinkRef = db.collection("users").doc(newOwnerUid).collection("teams").doc(teamId);

    const currentMemberRef = teamRef.collection("members").doc(uid);
    const newOwnerMemberRef = teamRef.collection("members").doc(newOwnerUid);

    await db.runTransaction(async (tx) => {
      const [teamSnap, currentLinkSnap, newOwnerLinkSnap, currentMemberSnap, newOwnerMemberSnap] =
        await Promise.all([
          tx.get(teamRef),
          tx.get(currentLinkRef),
          tx.get(newOwnerLinkRef),
          tx.get(currentMemberRef),
          tx.get(newOwnerMemberRef),
        ]);

      if (!teamSnap.exists) throw new Error("TEAM_NOT_FOUND");
      if (!currentLinkSnap.exists) throw new Error("NOT_A_MEMBER");
      if (!newOwnerLinkSnap.exists) throw new Error("NEW_OWNER_NOT_A_MEMBER");

      const myRole = currentLinkSnap.data()?.role;
      if (myRole !== "owner") throw new Error("FORBIDDEN");

      if (!currentMemberSnap.exists) throw new Error("NOT_A_MEMBER");
      if (!newOwnerMemberSnap.exists) throw new Error("NEW_OWNER_NOT_A_MEMBER");

      tx.update(currentMemberRef, { role: "member" });
      tx.update(newOwnerMemberRef, { role: "owner" });

      tx.update(currentLinkRef, { role: "member" });
      tx.update(newOwnerLinkRef, { role: "owner" });

      tx.update(teamRef, {
        ownerId: newOwnerUid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.json({ ok: true });
  } catch (e) {
    const msg = e?.message || "";
    if (msg === "TEAM_NOT_FOUND") return res.status(404).json({ error: "Team not found" });
    if (msg === "NOT_A_MEMBER") return res.status(403).json({ error: "Not a team member" });
    if (msg === "NEW_OWNER_NOT_A_MEMBER") return res.status(400).json({ error: "Selected user is not a team member" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "Only owner can transfer ownership" });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// видалити учасника
router.delete("/:teamId/members/:memberUid", requireAuth, async (req, res) => {
  const { teamId, memberUid } = req.params;
  const uid = req.user.uid;

  if (!memberUid) return res.status(400).json({ error: "MEMBER_UID_REQUIRED" });
  if (memberUid === uid) return res.status(400).json({ error: "CANT_REMOVE_SELF" });

  try {
    const teamRef = db.collection("teams").doc(teamId);
    const ownerLinkRef = db.collection("users").doc(uid).collection("teams").doc(teamId);
    const memberRef = teamRef.collection("members").doc(memberUid);
    const memberLinkRef = db.collection("users").doc(memberUid).collection("teams").doc(teamId);

    await db.runTransaction(async (tx) => {
      const [teamSnap, ownerLinkSnap, memberSnap] = await Promise.all([
        tx.get(teamRef),
        tx.get(ownerLinkRef),
        tx.get(memberRef),
      ]);

      if (!teamSnap.exists) throw new Error("TEAM_NOT_FOUND");
      if (!ownerLinkSnap.exists) throw new Error("NOT_A_MEMBER");

      const myRole = ownerLinkSnap.data()?.role;
      if (myRole !== "owner") throw new Error("FORBIDDEN");

      if (!memberSnap.exists) throw new Error("MEMBER_NOT_FOUND");

      const memberRole = memberSnap.data()?.role || "member";
      if (memberRole === "owner") throw new Error("CANT_REMOVE_OWNER");

      tx.delete(memberRef);
      tx.delete(memberLinkRef);

      tx.update(teamRef, {
        membersCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.json({ ok: true });
  } catch (e) {
    const msg = e?.message || "";

    if (msg === "TEAM_NOT_FOUND") return res.status(404).json({ error: "TEAM_NOT_FOUND" });
    if (msg === "NOT_A_MEMBER") return res.status(403).json({ error: "NOT_A_MEMBER" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "FORBIDDEN" });
    if (msg === "MEMBER_NOT_FOUND") return res.status(404).json({ error: "MEMBER_NOT_FOUND" });
    if (msg === "CANT_REMOVE_SELF") return res.status(400).json({ error: "CANT_REMOVE_SELF" });
    if (msg === "CANT_REMOVE_OWNER") return res.status(400).json({ error: "CANT_REMOVE_OWNER" });

    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});


// чат 
async function getMembership(teamId, uid) {
  const linkRef = db.collection("users").doc(uid).collection("teams").doc(teamId);
  const snap = await linkRef.get();
  if (!snap.exists) {
    const err = new Error("NOT_A_MEMBER");
    err.code = "NOT_A_MEMBER";
    throw err;
  }
  return snap.data() || {};
}

router.get("/:teamId/chat-link", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  try {
    await getMembership(teamId, uid);

    const teamSnap = await db.collection("teams").doc(teamId).get();
    if (!teamSnap.exists) return res.status(404).json({ error: "TEAM_NOT_FOUND" });

    const data = teamSnap.data() || {};
    return res.json({ link: String(data.chatInviteLink || "").trim() });
  } catch (e) {
    const msg = String(e?.message || "");
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") return res.status(403).json({ error: "NOT_A_MEMBER" });
    if (msg === "TEAM_NOT_FOUND") return res.status(404).json({ error: "TEAM_NOT_FOUND" });
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});


router.patch("/:teamId/chat-link", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;
  const link = String(req.body?.link || "").trim();
  if (link.length > 700) return res.status(400).json({ error: "LINK_TOO_LONG" });

  try {
    const membership = await getMembership(teamId, uid);
    if ((membership.role || "member") !== "owner") return res.status(403).json({ error: "FORBIDDEN" });

    const teamRef = db.collection("teams").doc(teamId);

    await db.runTransaction(async (tx) => {
      const teamSnap = await tx.get(teamRef);
      if (!teamSnap.exists) throw new Error("TEAM_NOT_FOUND");

      tx.update(teamRef, {
        chatInviteLink: link || "",
        chatInviteUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return res.json({ link });
  } catch (e) {
    const msg = String(e?.message || "");
    if (msg === "TEAM_NOT_FOUND") return res.status(404).json({ error: "TEAM_NOT_FOUND" });
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") return res.status(403).json({ error: "NOT_A_MEMBER" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "FORBIDDEN" });
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});


router.use("/:teamId/tasks", teamTasksRouter);
router.use("/:teamId/shopping", teamShopping);
router.use("/:teamId/finances", teamFinances);
router.use("/:teamId/events", teamEventsRouter);

module.exports = router;
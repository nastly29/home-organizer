const express = require("express");
const router = express.Router({ mergeParams: true });
const firebaseAdmin = require("../firebaseAdmin");
const { admin, db } = firebaseAdmin;
const requireAuthImport = require("../middleware/requireAuth");

const requireAuth =
  typeof requireAuthImport === "function"
    ? requireAuthImport
    : requireAuthImport.requireAuth;

//helpers 
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

function computeDeadlineAt(admin, dueDate, dueTime) {
  const d = String(dueDate || "").trim();
  if (!d) return null;

  const t = String(dueTime || "").trim();
  const iso = t ? `${d}T${t}:00` : `${d}T23:59:59`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;

  return admin.firestore.Timestamp.fromDate(new Date(ms));
}

function toIso(ts) {
  return ts?.toDate ? ts.toDate().toISOString() : null;
}

function taskToJson(doc) {
  const d = doc.data() || {};
  return {
    id: doc.id,
    title: d.title || "",
    dueDate: d.dueDate || "",
    dueTime: d.dueTime || "",
    deadlineAt: toIso(d.deadlineAt),

    assignees: Array.isArray(d.assignees) ? d.assignees : [],
    createdBy: d.createdBy || "",

    completed: !!d.completed,
    completedAt: toIso(d.completedAt),
    completedBy: d.completedBy || null,

    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
  };
}

async function validateAssigneesAreMembers(teamId, assignees) {
  const membersColl = db.collection("teams").doc(teamId).collection("members");
  const snaps = await Promise.all(assignees.map((uid) => membersColl.doc(uid).get()));
  return snaps.every((s) => s.exists);
}

function sortUndatedFirstThenDeadlineAsc(tasks) {
  tasks.sort((a, b) => {
    const aHas = !!a.deadlineAt;
    const bHas = !!b.deadlineAt;

    if (!aHas && bHas) return -1; 
    if (aHas && !bHas) return 1;
    if (!aHas && !bHas) return 0;

    return Date.parse(a.deadlineAt) - Date.parse(b.deadlineAt);
  });
  return tasks;
}

function sortCompletedByCompletedAtNewestFirst(tasks) {
  tasks.sort((a, b) => {
    const aMs = a.completedAt ? Date.parse(a.completedAt) : 0;
    const bMs = b.completedAt ? Date.parse(b.completedAt) : 0;
    return bMs - aMs; 
  });
  return tasks;
}

// отримати завдання
router.get("/", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;
  const filter = String(req.query?.filter || "all");
  const nowMs = Date.now();

  try {
    await assertTeamMember(teamId, uid);

    const tasksRef = db.collection("teams").doc(teamId).collection("tasks");

    let snap;
    if (filter === "mine") {
      snap = await tasksRef.where("assignees", "array-contains", uid).get();
    } else {
      snap = await tasksRef.get();
    }

    let tasks = snap.docs.map(taskToJson);

    if (filter === "completed") {
      tasks = tasks.filter((t) => t.completed === true);
      tasks = sortCompletedByCompletedAtNewestFirst(tasks);
      return res.json({ tasks });
    }

    tasks = tasks.filter((t) => t.completed === false);

    if (filter === "overdue") {
      tasks = tasks.filter((t) => t.deadlineAt && Date.parse(t.deadlineAt) < nowMs);
      tasks = sortUndatedFirstThenDeadlineAsc(tasks);
      return res.json({ tasks });
    }

    const undated = tasks.filter((t) => !t.deadlineAt);
    const datedNotOverdue = tasks
      .filter((t) => t.deadlineAt && Date.parse(t.deadlineAt) >= nowMs)
      .sort((a, b) => Date.parse(a.deadlineAt) - Date.parse(b.deadlineAt));

    return res.json({ tasks: [...undated, ...datedNotOverdue] });
  } catch (e) {
    console.error("[tasks:list]", e);
    const msg = String(e?.message || "");
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") {
      return res.status(403).json({ error: "NOT_A_MEMBER" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR", details: msg });
  }
});

// створити завдання
router.post("/", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  const title = String(req.body?.title || "").trim();
  const dueDate = String(req.body?.dueDate || "").trim(); 
  const dueTime = String(req.body?.dueTime || "").trim(); 
  const assignees = Array.isArray(req.body?.assignees) ? req.body.assignees.filter(Boolean) : [];

  if (title.length < 2) return res.status(400).json({ error: "TITLE_TOO_SHORT" });
  if (assignees.length === 0) return res.status(400).json({ error: "ASSIGNEES_REQUIRED" });

  try {
    await assertTeamMember(teamId, uid);

    const ok = await validateAssigneesAreMembers(teamId, assignees);
    if (!ok) return res.status(400).json({ error: "ASSIGNEE_NOT_MEMBER" });

    const deadlineAt = computeDeadlineAt(admin, dueDate, dueTime);

    const taskRef = tasksRef(teamId).doc();
    await taskRef.set({
      title,
      dueDate: dueDate || "",
      dueTime: dueTime || "",
      deadlineAt: deadlineAt || null,

      assignees,
      createdBy: uid,

      completed: false,
      completedAt: null,
      completedBy: null,

      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const snap = await taskRef.get();
    return res.status(201).json({ task: taskToJson(snap) });
  } catch (e) {
    console.error("[tasks:create]", e);
    const msg = String(e?.message || "");
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") {
      return res.status(403).json({ error: "NOT_A_MEMBER" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR", details: msg });
  }
});

function tasksRef(teamId) {
  return db.collection("teams").doc(teamId).collection("tasks");
}

// редагувати завдання
router.patch("/:taskId", requireAuth, async (req, res) => {
  const { teamId, taskId } = req.params;
  const uid = req.user.uid;

  const titleRaw = req.body?.title;
  const dueDateRaw = req.body?.dueDate;
  const dueTimeRaw = req.body?.dueTime;
  const assigneesRaw = req.body?.assignees;

  try {
    await assertTeamMember(teamId, uid);

    const taskRef = tasksRef(teamId).doc(taskId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(taskRef);
      if (!snap.exists) throw new Error("TASK_NOT_FOUND");

      const data = snap.data() || {};
      if ((data.createdBy || "") !== uid) throw new Error("FORBIDDEN");

      const patch = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };

      if (titleRaw !== undefined) {
        const title = String(titleRaw || "").trim();
        if (title.length < 2) throw new Error("TITLE_TOO_SHORT");
        patch.title = title;
      }

      if (assigneesRaw !== undefined) {
        const assignees = Array.isArray(assigneesRaw) ? assigneesRaw.filter(Boolean) : [];
        if (assignees.length === 0) throw new Error("ASSIGNEES_REQUIRED");

        const ok = await validateAssigneesAreMembers(teamId, assignees);
        if (!ok) throw new Error("ASSIGNEE_NOT_MEMBER");

        patch.assignees = assignees;
      }

      const nextDueDate =
        dueDateRaw !== undefined ? String(dueDateRaw || "").trim() : String(data.dueDate || "").trim();
      const nextDueTime =
        dueTimeRaw !== undefined ? String(dueTimeRaw || "").trim() : String(data.dueTime || "").trim();

      if (dueDateRaw !== undefined) patch.dueDate = nextDueDate;
      if (dueTimeRaw !== undefined) patch.dueTime = nextDueTime;

      if (dueDateRaw !== undefined || dueTimeRaw !== undefined) {
        patch.deadlineAt = computeDeadlineAt(admin, nextDueDate, nextDueTime) || null;
      }

      tx.update(taskRef, patch);
    });

    const updated = await tasksRef(teamId).doc(taskId).get();
    return res.json({ task: taskToJson(updated) });
  } catch (e) {
    console.error("[tasks:update]", e);
    const msg = String(e?.message || "");
    if (msg === "TASK_NOT_FOUND") return res.status(404).json({ error: "TASK_NOT_FOUND" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "ONLY_AUTHOR_CAN_EDIT" });
    if (msg === "TITLE_TOO_SHORT") return res.status(400).json({ error: "TITLE_TOO_SHORT" });
    if (msg === "ASSIGNEES_REQUIRED") return res.status(400).json({ error: "ASSIGNEES_REQUIRED" });
    if (msg === "ASSIGNEE_NOT_MEMBER") return res.status(400).json({ error: "ASSIGNEE_NOT_MEMBER" });
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") return res.status(403).json({ error: "NOT_A_MEMBER" });
    return res.status(500).json({ error: "INTERNAL_ERROR", details: msg });
  }
});

// видалити завдання
router.delete("/:taskId", requireAuth, async (req, res) => {
  const { teamId, taskId } = req.params;
  const uid = req.user.uid;

  try {
    await assertTeamMember(teamId, uid);

    const taskRef = tasksRef(teamId).doc(taskId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(taskRef);
      if (!snap.exists) throw new Error("TASK_NOT_FOUND");

      const data = snap.data() || {};
      if ((data.createdBy || "") !== uid) throw new Error("FORBIDDEN");

      tx.delete(taskRef);
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error("[tasks:delete]", e);
    const msg = String(e?.message || "");
    if (msg === "TASK_NOT_FOUND") return res.status(404).json({ error: "TASK_NOT_FOUND" });
    if (msg === "FORBIDDEN") return res.status(403).json({ error: "ONLY_AUTHOR_CAN_DELETE" });
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") return res.status(403).json({ error: "NOT_A_MEMBER" });
    return res.status(500).json({ error: "INTERNAL_ERROR", details: msg });
  }
});

// позначити виконаним завдання
router.patch("/:taskId/toggle-complete", requireAuth, async (req, res) => {
  const { teamId, taskId } = req.params;
  const uid = req.user.uid;

  try {
    await assertTeamMember(teamId, uid);

    const taskRef = tasksRef(teamId).doc(taskId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(taskRef);
      if (!snap.exists) throw new Error("TASK_NOT_FOUND");

      const data = snap.data() || {};
      const assignees = Array.isArray(data.assignees) ? data.assignees : [];
      if (!assignees.includes(uid)) throw new Error("ONLY_ASSIGNEE_CAN_TOGGLE");

      const nextCompleted = !data.completed;

      tx.update(taskRef, {
        completed: nextCompleted,
        completedAt: nextCompleted ? admin.firestore.FieldValue.serverTimestamp() : null,
        completedBy: nextCompleted ? uid : null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    const updated = await tasksRef(teamId).doc(taskId).get();
    return res.json({ task: taskToJson(updated) });
  } catch (e) {
    console.error("[tasks:toggle]", e);
    const msg = String(e?.message || "");
    if (msg === "TASK_NOT_FOUND") return res.status(404).json({ error: "TASK_NOT_FOUND" });
    if (msg === "ONLY_ASSIGNEE_CAN_TOGGLE") return res.status(403).json({ error: "ONLY_ASSIGNEE_CAN_TOGGLE" });
    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") return res.status(403).json({ error: "NOT_A_MEMBER" });
    return res.status(500).json({ error: "INTERNAL_ERROR", details: msg });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router({ mergeParams: true });

const firebaseAdmin = require("../firebaseAdmin");
const { db } = firebaseAdmin;

const requireAuthImport = require("../middleware/requireAuth");
const requireAuth =
  typeof requireAuthImport === "function"
    ? requireAuthImport
    : requireAuthImport.requireAuth;

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

function pad2(n) {
  return String(n).padStart(2, "0");
}

function kyivParts(now = new Date()) {
  const dtfDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dtfTime = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const date = dtfDate.format(now); 
  const time = dtfTime.format(now); 
  const month = date.slice(0, 7);   
  return { date, time, month };
}

function mondaySundayRange(dateStr) {
  const [yy, mm, dd] = String(dateStr).split("-").map((x) => Number(x));
  if (!yy || !mm || !dd) return null;

  const base = new Date(Date.UTC(yy, mm - 1, dd));
  const jsDow = base.getUTCDay(); 
  const offset = (jsDow + 6) % 7; 

  const monday = new Date(Date.UTC(yy, mm - 1, dd - offset));
  const sunday = new Date(Date.UTC(yy, mm - 1, dd - offset + 6));

  const toStr = (d) => {
    const y = d.getUTCFullYear();
    const m = pad2(d.getUTCMonth() + 1);
    const day = pad2(d.getUTCDate());
    return `${y}-${m}-${day}`;
  };

  return { monday: toStr(monday), sunday: toStr(sunday) };
}

function isWithinRange(isoDate, start, end) {
  if (!isoDate) return false;
  return isoDate >= start && isoDate <= end; 
}

function isOverdueTask(task, nowDate, nowTime) {
  const d = String(task?.dueDate || "").trim();
  if (!d) return false;

  if (d < nowDate) return true;
  if (d > nowDate) return false;

  const t = String(task?.dueTime || "").trim();
  if (!t) return false;
  return t < nowTime;
}

router.get("/:teamId/dashboard", requireAuth, async (req, res) => {
  const { teamId } = req.params;
  const uid = req.user.uid;

  try {
    await assertTeamMember(teamId, uid);

    const { date: today, time: nowTime, month: thisMonth } = kyivParts(new Date());
    const week = mondaySundayRange(today);
    if (!week) return res.status(500).json({ error: "DATE_RANGE_ERROR" });

    const tasksSnap = await db
      .collection("teams")
      .doc(teamId)
      .collection("tasks")
      .where("completed", "==", false)
      .get();

    const openTasks = tasksSnap.docs.map((d) => d.data() || {});

    let weekOpenTotal = 0;
    let weekOpenMine = 0;
    let overdueOpen = 0;

    for (const t of openTasks) {
      const dueDate = String(t.dueDate || "").trim();
      if (!dueDate) continue;

      const assignees = Array.isArray(t.assignees) ? t.assignees : [];

      const overdue = isOverdueTask(t, today, nowTime);

      if (overdue) {
        overdueOpen += 1;
        continue; 
      }

      if (isWithinRange(dueDate, week.monday, week.sunday)) {
        weekOpenTotal += 1;
        if (assignees.includes(uid)) weekOpenMine += 1;
      }
    }

    const shoppingSnap = await db
      .collection("teams")
      .doc(teamId)
      .collection("shopping")
      .get();

    const shoppingOpenCount = shoppingSnap.size || 0;

    const finSnap = await db
      .collection("teams")
      .doc(teamId)
      .collection("finances")
      .get();

    let monthTotal = 0;
    let monthMine = 0;

    for (const doc of finSnap.docs) {
      const d = doc.data() || {};
      const spentDate = String(d.spentDate || "").trim(); 
      if (!spentDate || !spentDate.startsWith(thisMonth)) continue;

      const amount = typeof d.amount === "number" ? d.amount : Number(d.amount || 0);
      if (!Number.isFinite(amount)) continue;

      monthTotal += amount;
      if (String(d.spenderUid || "") === uid) monthMine += amount;
    }

    const eventsRef = db.collection("teams").doc(teamId).collection("events");

    const weekEventsSnap = await eventsRef
      .where("date", ">=", week.monday)
      .where("date", "<=", week.sunday)
      .get();

    const eventsWeekCount = weekEventsSnap.size || 0;

    const todayEventsSnap = await eventsRef.where("date", "==", today).get();
    const todayTitles = todayEventsSnap.docs
      .map((d) => (d.data() || {}).title || "")
      .filter(Boolean);

    return res.json({
      now: { today, nowTime, weekStart: week.monday, weekEnd: week.sunday, month: thisMonth },
      tasks: {
        weekOpenTotal,
        weekOpenMine,
        overdueOpen,
      },
      shopping: {
        openCount: shoppingOpenCount,
      },
      finances: {
        monthTotal,
        monthMine,
      },
      events: {
        weekCount: eventsWeekCount,
        todayTitles,
      },
    });
  } catch (e) {
    console.error("[dashboard]", e);
    const msg = String(e?.message || "");

    if (e?.code === "NOT_A_MEMBER" || msg === "NOT_A_MEMBER") {
      return res.status(403).json({ error: "NOT_A_MEMBER" });
    }
    return res.status(500).json({ error: "INTERNAL_ERROR" });
  }
});

module.exports = router;

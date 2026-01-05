const { admin } = require("../firebaseAdmin");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer (.+)$/);

    if (!match) {
      return res.status(401).json({ error: "Missing Bearer token" });
    }

    const decoded = await admin.auth().verifyIdToken(match[1]);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = { requireAuth };

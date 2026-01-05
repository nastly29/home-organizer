const express = require("express");
const cors = require("cors");
//const path = require("path");

const usersRouter = require("./routes/users");
const teamsRouter = require("./routes/teams");
const authRouter = require("./routes/auth");
const teamDashboard = require("./routes/teamDashboard");

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials:true
}))
//const isProd = process.env.NODE_ENV === "production";

//if (!isProd) {
  //app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
//}

app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/users", usersRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/auth", authRouter);
app.use("/api/teams", teamDashboard);

//if (isProd) {
  //const clientBuildPath = path.join(__dirname, "..", "client", "build");
  //app.use(express.static(clientBuildPath));
  //app.get(/^(?!\/api).*/, (req, res) => {
    //res.sendFile(path.join(clientBuildPath, "index.html"));
  //});
//} 

/*app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});*/

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

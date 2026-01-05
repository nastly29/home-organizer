import { Routes, Route } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import PrivateLayout from "./layouts/PrivateLayout";

import PublicHome from "./pages/PublicHome";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import TeamLayout from "./layouts/TeamLayout";
import TeamHome from "./pages/TeamHome";

import TeamMembersPage from "./pages/team/TeamMembers";
import TeamTasks from "./pages/team/TeamTasks";
import TeamShopping from "./pages/team/TeamShopping";
import TeamFinances from "./pages/team/TeamFinances";
import TeamCalendar from "./pages/team/TeamCalendar";
import TeamChat from "./pages/team/TeamChat";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PublicHome />} />
      </Route>

      <Route element={<PrivateLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/teams/:teamId" element={<TeamLayout />}>
          <Route path="members" element={<TeamMembersPage />} />
          <Route index element={<TeamHome />} />
          <Route path="tasks" element={<TeamTasks />} />
          <Route path="shopping" element={<TeamShopping />} />
          <Route path="finances" element={<TeamFinances />} />
          <Route path="calendar" element={<TeamCalendar />} />
          <Route path="chat" element={<TeamChat />} />
        </Route>
      </Route>
    </Routes>
  );
}

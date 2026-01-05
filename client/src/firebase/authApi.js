import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { auth } from "./firebase";

//AUTH 
export async function apiLogin({ email, password }) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function apiRegister({ email, password, displayName }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred;
}

export async function apiForgotPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function apiUpdateDisplayName(displayName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Користувач не авторизований");
  await updateProfile(user, { displayName: displayName.trim() });
}

export async function apiReauthWithPassword(currentPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error("Користувач не авторизований");
  if (!user.email) throw new Error("Email відсутній");

  const cred = EmailAuthProvider.credential(user.email, currentPassword);
  return reauthenticateWithCredential(user, cred);
}

export async function apiUpdateEmail(newEmail) {
  const user = auth.currentUser;
  if (!user) throw new Error("Користувач не авторизований");

  const actionCodeSettings = {
    url: window.location.origin + "/profile",
    handleCodeInApp: false,
  };

  return verifyBeforeUpdateEmail(user, newEmail.trim(), actionCodeSettings);
}

export async function apiUpdatePassword(newPassword) {
  const user = auth.currentUser;
  if (!user) throw new Error("Користувач не авторизований");
  return updatePassword(user, newPassword);
}

export async function apiDeleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error("Користувач не авторизований");
  return deleteUser(user);
}

// ===========================================================================
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

async function authedRequest(path, { method = "GET", body } = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}
// ===========================================================================

// USERS
export function apiEnsureMe(displayName) {
  return authedRequest("/api/users/me/ensure", {
    method: "POST",
    body: displayName ? { displayName } : {},
  });
}

export function apiGetMe() {
  return authedRequest("/api/users/me");
}

export function apiEmailExists(email) {
  return authedRequest(`/api/auth/email-exists?email=${encodeURIComponent(email)}`);
}

// TEAMS
export function apiCreateTeam(name) {
  return authedRequest("/api/teams", {
    method: "POST",
    body: { name },
  });
}

export function apiListTeams() {
  return authedRequest("/api/teams");
}

export function apiGetTeam(teamId) {
  return authedRequest(`/api/teams/${teamId}`);
}

export function apiJoinTeam(teamId) {
  return authedRequest("/api/teams/join", {
    method: "POST",
    body: { teamId },
  });
}

export function apiListTeamMembers(teamId) {
  return authedRequest(`/api/teams/${teamId}/members`);
}

export function apiLeaveTeam(teamId) {
  return authedRequest(`/api/teams/${teamId}/leave`, {
    method: "POST",
    body: {},
  });
}

export function apiUpdateTeamName(teamId, name) {
  return authedRequest(`/api/teams/${teamId}`, {
    method: "PATCH",
    body: { name },
  });
}

export function apiDeleteTeam(teamId) {
  return authedRequest(`/api/teams/${teamId}`, {
    method: "DELETE",
  });
}

export function apiTransferTeamOwner(teamId, newOwnerUid) {
  return authedRequest(`/api/teams/${teamId}/transfer-owner`, {
    method: "POST",
    body: { newOwnerUid },
  });
}

export function apiRemoveTeamMember(teamId, memberUid) {
  return authedRequest(`/api/teams/${teamId}/members/${memberUid}`, {
    method: "DELETE",
  });
}

// TASKS
export async function apiListTeamTasks(teamId, filter = "all") {
  return authedRequest(`/api/teams/${teamId}/tasks?filter=${encodeURIComponent(filter)}`);
}

export async function apiCreateTeamTask(teamId, payload) {
  return authedRequest(`/api/teams/${teamId}/tasks`, {
    method: "POST",
    body: payload,
  });
}

export async function apiUpdateTeamTask(teamId, taskId, payload) {
  return authedRequest(`/api/teams/${teamId}/tasks/${taskId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function apiDeleteTeamTask(teamId, taskId) {
  return authedRequest(`/api/teams/${teamId}/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export async function apiToggleTeamTaskComplete(teamId, taskId) {
  return authedRequest(`/api/teams/${teamId}/tasks/${taskId}/toggle-complete`, {
    method: "PATCH",
  });
}

// SHOPPING 
export function apiListTeamShopping(teamId, category = "all") {
  return authedRequest(
    `/api/teams/${teamId}/shopping?category=${encodeURIComponent(category)}`
  );
}

export function apiCreateTeamShopping(teamId, payload) {
  return authedRequest(`/api/teams/${teamId}/shopping`, {
    method: "POST",
    body: payload,
  });
}

export function apiUpdateTeamShopping(teamId, itemId, payload) {
  return authedRequest(`/api/teams/${teamId}/shopping/${itemId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function apiConfirmTeamShoppingBuy(teamId, itemId) {
  return authedRequest(`/api/teams/${teamId}/shopping/${itemId}/confirm`, {
    method: "POST",
  });
}

export function apiDeleteTeamShoppingItem(teamId, itemId) {
  return authedRequest(`/api/teams/${teamId}/shopping/${itemId}`, {
    method: "DELETE",
  });
}

// FINANCES 
export async function apiListTeamFinances(teamId, filter = "all") {
  return authedRequest(`/api/teams/${teamId}/finances?filter=${encodeURIComponent(filter)}`);
}

export async function apiCreateTeamFinance(teamId, payload) {
  return authedRequest(`/api/teams/${teamId}/finances`, {
    method: "POST",
    body: payload,
  });
}

export async function apiUpdateTeamFinance(teamId, itemId, payload) {
  return authedRequest(`/api/teams/${teamId}/finances/${itemId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function apiDeleteTeamFinance(teamId, itemId) {
  return authedRequest(`/api/teams/${teamId}/finances/${itemId}`, {
    method: "DELETE",
  });
}

// EVENTS
export async function apiListTeamEvents(teamId, month) {
  return authedRequest(`/api/teams/${teamId}/events?month=${encodeURIComponent(month)}`);
}

export async function apiCreateTeamEvent(teamId, payload) {
  return authedRequest(`/api/teams/${teamId}/events`, {
    method: "POST",
    body: payload,
  });
}

export async function apiUpdateTeamEvent(teamId, eventId, payload) {
  return authedRequest(`/api/teams/${teamId}/events/${eventId}`, {
    method: "PATCH",
    body: payload,
  });
}

export async function apiDeleteTeamEvent(teamId, eventId) {
  return authedRequest(`/api/teams/${teamId}/events/${eventId}`, {
    method: "DELETE",
  });
}

// CHAT LINK
export function apiGetTeamChatLink(teamId) {
  return authedRequest(`/api/teams/${teamId}/chat-link`);
}

export function apiUpdateTeamChatLink(teamId, link) {
  return authedRequest(`/api/teams/${teamId}/chat-link`, {
    method: "PATCH",
    body: { link },
  });
}

// статистика
export function apiGetTeamDashboard(teamId) {
  return authedRequest(`/api/teams/${teamId}/dashboard`);
}
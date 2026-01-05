export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email?.trim()) return "Введіть email";
  if (!emailRegex.test(email.trim())) return "Некоректний email";
  return "";
}

export function validatePassword(pw) {
  if (!pw) return "Введіть пароль";
  if (pw.length < 6) return "Мінімум 6 символів";
  return "";
}

export function validateConfirmPassword(pw, confirm) {
  if (!confirm) return "Повторіть пароль";
  if (pw !== confirm) return "Паролі не співпадають";
  return "";
}

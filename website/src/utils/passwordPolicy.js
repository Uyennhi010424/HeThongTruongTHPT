/**
 * Password Policy & Strength Checker Utility
 * Enforces:
 * - Length: 8 to 100 characters
 * - At least 1 uppercase letter (A-Z)
 * - At least 1 lowercase letter (a-z)
 * - At least 1 digit (0-9)
 * - At least 1 special character (@, #, $, !, %, ^, &, *, etc.)
 */

export const PASSWORD_RULES = [
  { id: "length", label: "Tối thiểu 8 ký tự", test: (p) => p.length >= 8 },
  { id: "upper", label: "Ít nhất 1 chữ cái in hoa (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Ít nhất 1 chữ cái in thường (a-z)", test: (p) => /[a-z]/.test(p) },
  { id: "digit", label: "Ít nhất 1 chữ số (0-9)", test: (p) => /\d/.test(p) },
  { id: "special", label: "Ít nhất 1 ký tự đặc biệt (@, #, $, !, %,...)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const validatePassword = (password) => {
  if (!password || !password.trim()) {
    return "Vui lòng nhập mật khẩu mới.";
  }
  const p = password.trim();
  if (p.length < 8) {
    return "Mật khẩu mới phải có ít nhất 8 ký tự.";
  }
  if (p.length > 100) {
    return "Mật khẩu mới không được vượt quá 100 ký tự.";
  }
  if (!/[A-Z]/.test(p)) {
    return "Mật khẩu mới phải chứa ít nhất 1 chữ cái in hoa (A-Z).";
  }
  if (!/[a-z]/.test(p)) {
    return "Mật khẩu mới phải chứa ít nhất 1 chữ cái in thường (a-z).";
  }
  if (!/\d/.test(p)) {
    return "Mật khẩu mới phải chứa ít nhất 1 chữ số (0-9).";
  }
  if (!/[^A-Za-z0-9]/.test(p)) {
    return "Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt (@, #, $, !, %,...).";
  }
  return null;
};

export const getPasswordStrength = (password) => {
  if (!password) {
    return { score: 0, label: "Trống", color: "bg-slate-200", textColor: "text-slate-400" };
  }
  const passedCount = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passedCount <= 2) {
    return { score: 25, label: "Yếu", color: "bg-red-500", textColor: "text-red-600" };
  }
  if (passedCount <= 4) {
    return { score: 65, label: "Trung bình", color: "bg-amber-500", textColor: "text-amber-600" };
  }
  return { score: 100, label: "Mạnh", color: "bg-emerald-500", textColor: "text-emerald-600" };
};

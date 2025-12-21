export const validateName = (name: string): string => {
  if (!name.trim()) return "Name is required";
  if (!/^[a-zA-Z\s]{3,}$/.test(name)) return "Name must be at least 3 characters and contain only letters";
  return "";
};

export const validateEmail = (email: string): string => {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address";
  return "";
};

export const validatePassword = (password: string): string => {
  if (!password.trim()) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters long";
  return "";
};

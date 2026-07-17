import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UserProfile } from "../../types";

interface AuthContextValue {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (
    data: Omit<UserProfile, "createdAt">,
    password: string
  ) => Promise<UserProfile>;
  logout: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_USER = "trayyath.currentUser";
const STORAGE_USERS = "trayyath.users";

interface StoredUser {
  profile: UserProfile;
  password: string;
}

function loadUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_USERS) ?? "[]");
  } catch {
    return [];
  }
}
function saveUsers(users: StoredUser[]) {
  localStorage.setItem(STORAGE_USERS, JSON.stringify(users));
}

function seedIfEmpty() {
  const users = loadUsers();
  if (users.length > 0) return;
  const now = new Date().toISOString();
  const seeded: StoredUser[] = [
    {
      password: "123456",
      profile: {
        fullName: "أحمد بن سالم القحطاني",
        nationalId: "1076543219",
        email: "ahmed@trayyath.demo",
        phone: "0551234567",
        monthlySalary: 18500,
        optionalSavings: 42000,
        createdAt: now,
      },
    },
  ];
  saveUsers(seeded);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    seedIfEmpty();
    const raw = localStorage.getItem(STORAGE_USER);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem(STORAGE_USER);
      }
    }
  }, []);

  const persist = useCallback((profile: UserProfile | null) => {
    setUser(profile);
    if (profile) localStorage.setItem(STORAGE_USER, JSON.stringify(profile));
    else localStorage.removeItem(STORAGE_USER);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const users = loadUsers();
      const match = users.find(
        (u) => u.profile.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!match) throw new Error("بيانات الدخول غير صحيحة.");
      persist(match.profile);
      return match.profile;
    },
    [persist]
  );

  const register = useCallback(
    async (data: Omit<UserProfile, "createdAt">, password: string) => {
      const users = loadUsers();
      if (users.some((u) => u.profile.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error("هذا البريد مسجّل مسبقاً.");
      }
      const profile: UserProfile = {
        createdAt: new Date().toISOString(),
        ...data,
      };
      users.push({ password, profile });
      saveUsers(users);
      persist(profile);
      return profile;
    },
    [persist]
  );

  const logout = useCallback(() => persist(null), [persist]);

  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      if (!user) return;
      const merged = { ...user, ...patch };
      const users = loadUsers().map((u) =>
        u.profile.email === user.email ? { ...u, profile: merged } : u
      );
      saveUsers(users);
      persist(merged);
    },
    [user, persist]
  );

  const value = useMemo(
    () => ({ user, login, register, logout, updateProfile }),
    [user, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

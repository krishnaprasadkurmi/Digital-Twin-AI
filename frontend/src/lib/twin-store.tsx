import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { createUser, getDefaultUser, getUserByEmail, getUserByUsername } from "./api";

export type Profile = {
  id: string;
  name: string;
  email: string;
  password: string;
  age: number;
  targetAge: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  netWorth: number;
  targetNetWorth: number;
  sleepHours: number;
  screenTime: number;
  studyHours: number;
  exerciseDays: number;
  focusArea: string;
  goalName: string;
  goalTarget: number;
  goalCurrent: number;
  savingsRate: number;
  onboarded: boolean;
  theme: "light" | "dark";
};

export type LogEntry = {
  date: string;
  sleep: number;
  study: number;
  exercise: number;
  screen: number;
};

export type TwinState = {
  authed: boolean;
  profile: Profile;
  logs: LogEntry[];
  tasks: Array<{ id: string; text: string; done: boolean }>;
  adopted: string[];
  theme: "light" | "dark";
};

export type Suggestion = {
  id: string;
  category: string;
  impact: string;
  title: string;
  detail: string;
  start: string;
  minutes: number;
};

type TwinContextValue = {
  state: TwinState;
  ready: boolean;
  signIn: (username: string, email: string, signup?: boolean) => Promise<boolean>;
  loadDemo: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => void;
  setTheme: (theme: "light" | "dark") => void;
  addLog: (entry: LogEntry) => void;
  addTxn: (entry: { date: string; amount: number; kind: string; note?: string }) => void;
  addTask: (text: string) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  adopt: (changes: Partial<Profile> | Suggestion) => void;
  reset: () => void;
  signOut: () => void;
  clearLogs: () => void;
};

const defaultProfile: Profile = {
  id: "demo",
  name: "Demo Twin",
  email: "demo@digital-twin.local",
  password: "demo",
  age: 28,
  targetAge: 45,
  monthlyIncome: 6500,
  monthlyExpenses: 3200,
  netWorth: 96000,
  targetNetWorth: 2000000,
  sleepHours: 7.5,
  screenTime: 4.5,
  studyHours: 12,
  exerciseDays: 4,
  focusArea: "Build a calm, focused life",
  goalName: "A 6-month safety buffer",
  goalTarget: 30000,
  goalCurrent: 12000,
  savingsRate: 20,
  onboarded: true,
  theme: "dark",
};

const createInitialState = (): TwinState => ({
  authed: false,
  profile: defaultProfile,
  logs: [
    { date: "2026-07-01", sleep: 7.2, study: 5, exercise: 4, screen: 4.3 },
    { date: "2026-07-02", sleep: 7.6, study: 6, exercise: 3, screen: 4.6 },
    { date: "2026-07-03", sleep: 7.4, study: 4, exercise: 4, screen: 4.1 },
  ],
  tasks: [
    { id: "1", text: "Review budget", done: false },
    { id: "2", text: "Complete one study block", done: true },
  ],
  adopted: [],
  theme: "dark",
});

const TwinContext = createContext<TwinContextValue | null>(null);

function readStoredState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("digital-twin-state");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredState(state: TwinState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("digital-twin-state", JSON.stringify(state));
}

export function TwinProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TwinState>(() => {
    const stored = readStoredState();
    if (stored) {
      return { ...createInitialState(), ...stored, profile: { ...defaultProfile, ...(stored.profile || {}) } };
    }
    return createInitialState();
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    writeStoredState(state);
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const htmlElement = document.documentElement;
    if (state.theme === "dark") {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }
  }, [state.theme]);

  const signIn = async (username: string, email: string, signup = false) => {
    const normalizedUsername = username.trim();

    if (signup) {
      const created = await createUser({
        username: normalizedUsername,
        email,
        age: 25,
        retirement_goal_age: 60,
        target_net_worth: 1000000,
        monthly_income: 5000,
        sleep_target_hours: 8,
        study_target_hours_week: 15,
      });

      setState((current) => ({
        ...current,
        authed: true,
        profile: {
          ...current.profile,
          id: String(created.id),
          name: created.username,
          email: created.email,
          onboarding: false,
          age: created.age,
          targetAge: created.retirement_goal_age,
          monthlyIncome: created.monthly_income,
          targetNetWorth: created.target_net_worth,
          sleepHours: created.sleep_target_hours,
          studyHours: created.study_target_hours_week,
          onboarded: false,
          password: "demo-password",
        },
      }));
      return false;
    }

    try {
      const user = await getUserByUsername(normalizedUsername);
      setState((current) => ({
        ...current,
        authed: true,
        profile: {
          ...current.profile,
          id: String(user.id),
          name: user.username,
          email: user.email,
          age: user.age,
          targetAge: user.retirement_goal_age,
          monthlyIncome: user.monthly_income,
          targetNetWorth: user.target_net_worth,
          sleepHours: user.sleep_target_hours,
          studyHours: user.study_target_hours_week,
          onboarded: true,
          password: "demo-password",
        },
      }));
      return true;
    } catch {
      try {
        const user = await getUserByEmail(email);
        setState((current) => ({
          ...current,
          authed: true,
          profile: {
            ...current.profile,
            id: String(user.id),
            name: user.username,
            email: user.email,
            age: user.age,
            targetAge: user.retirement_goal_age,
            monthlyIncome: user.monthly_income,
            targetNetWorth: user.target_net_worth,
            sleepHours: user.sleep_target_hours,
            studyHours: user.study_target_hours_week,
            onboarded: true,
            password: "demo-password",
          },
        }));
        return true;
      } catch {
        throw new Error("Please sign up first");
      }
    }
  };

  const loadDemo = async () => {
    const user = await getDefaultUser();
    setState((current) => ({
      ...current,
      authed: true,
      profile: {
        ...defaultProfile,
        id: String(user.id),
        name: user.username,
        email: user.email,
        age: user.age,
        targetAge: user.retirement_goal_age,
        monthlyIncome: user.monthly_income,
        targetNetWorth: user.target_net_worth,
        sleepHours: user.sleep_target_hours,
        studyHours: user.study_target_hours_week,
      },
      logs: [
        { date: "2026-07-01", sleep: 7.2, study: 5, exercise: 4, screen: 4.3 },
        { date: "2026-07-02", sleep: 7.6, study: 6, exercise: 3, screen: 4.6 },
        { date: "2026-07-03", sleep: 7.4, study: 4, exercise: 4, screen: 4.1 },
      ],
      tasks: [
        { id: "1", text: "Review budget", done: false },
        { id: "2", text: "Complete one study block", done: true },
      ],
      adopted: [],
    }));
  };

  const updateProfile = (updates: Partial<Profile>) => {
    setState((current) => ({ ...current, profile: { ...current.profile, ...updates } }));
  };

  const setTheme = (theme: "light" | "dark") => {
    setState((current) => ({ ...current, theme, profile: { ...current.profile, theme } }));
  };

  const addLog = (entry: LogEntry) => {
    setState((current) => ({ ...current, logs: [...current.logs, entry] }));
  };

  const addTxn = (entry: { date: string; amount: number; kind: string; note?: string }) => {
    const next = [...state.logs];
    next.push({ date: entry.date, sleep: state.profile.sleepHours, study: state.profile.studyHours / 7, exercise: state.profile.exerciseDays, screen: state.profile.screenTime });
    setState((current) => ({ ...current, logs: next }));
  };

  const addTask = (text: string) => {
    setState((current) => ({
      ...current,
      tasks: [...current.tasks, { id: `${Date.now()}`, text, done: false }],
    }));
  };

  const toggleTask = (id: string) => {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }));
  };

  const removeTask = (id: string) => {
    setState((current) => ({ ...current, tasks: current.tasks.filter((task) => task.id !== id) }));
  };

  const adopt = (changes: Partial<Profile> | Suggestion) => {
    if ("title" in changes) {
      setState((current) => ({
        ...current,
        adopted: current.adopted.includes(changes.id) ? current.adopted : [...current.adopted, changes.id],
      }));
      return;
    }
    updateProfile(changes);
  };

  const reset = () => {
    setState(createInitialState());
  };

  const signOut = () => {
    setState(createInitialState());
  };

  const clearLogs = () => {
    setState((current) => ({ ...current, logs: [] }));
  };

  const value = useMemo(
    () => ({
      state,
      ready,
      signIn,
      loadDemo,
      updateProfile,
      setTheme,
      addLog,
      addTxn,
      addTask,
      toggleTask,
      removeTask,
      adopt,
      reset,
      signOut,
      clearLogs,
    }),
    [state, ready],
  );

  return <TwinContext.Provider value={value}>{children}</TwinContext.Provider>;
}

export const SUGGESTIONS: Suggestion[] = [
  {
    id: "sleep-30",
    category: "Recovery",
    impact: "High",
    title: "Add 30 minutes before bed",
    detail: "A calmer evening routine can improve both sleep quality and next-day focus.",
    start: "Tonight",
    minutes: 30,
  },
  {
    id: "study-45",
    category: "Learning",
    impact: "Medium",
    title: "Protect one focused study block",
    detail: "A 45-minute block is enough to build momentum without overloading the day.",
    start: "Tomorrow",
    minutes: 45,
  },
  {
    id: "walk-20",
    category: "Energy",
    impact: "Medium",
    title: "Take a short walk after lunch",
    detail: "A short walk helps reset energy and can lift your evening mood.",
    start: "Today",
    minutes: 20,
  },
];

export function useTwin() {
  const context = useContext(TwinContext);
  if (!context) throw new Error("useTwin must be used within TwinProvider");
  return context;
}

export function baseline(logs: LogEntry[]) {
  const days = logs.length;
  if (!days) return { days: 0, sleep: 0, study: 0, exercise: 0, screen: 0 };
  return {
    days,
    sleep: logs.reduce((sum, entry) => sum + entry.sleep, 0) / days,
    study: logs.reduce((sum, entry) => sum + entry.study, 0) / days,
    exercise: logs.reduce((sum, entry) => sum + entry.exercise, 0) / days,
    screen: logs.reduce((sum, entry) => sum + entry.screen, 0) / days,
  };
}

export function healthIndex(sleep: number, exercise: number, screen: number) {
  return Math.max(0, Math.min(10, 4 + (sleep - 6) * 0.5 + exercise / 20 - screen * 0.2));
}

export function focusIndex(sleep: number, study: number, screen: number) {
  return Math.max(0, Math.min(10, 3.5 + (sleep - 6) * 0.35 + study * 0.12 - screen * 0.2));
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function today() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

export function projectNetWorth(start: number, monthlyContribution: number, years: number) {
  const rows = [] as Array<{ year: number; value: number }>;
  let balance = start;
  for (let year = 1; year <= years; year += 1) {
    balance += monthlyContribution * 12;
    rows.push({ year, value: balance });
  }
  return rows;
}

export function monteCarlo(start: number, monthlyContribution: number, years: number) {
  const rows = [] as Array<{ year: number; value: number }>;
  let balance = start;
  for (let year = 1; year <= years; year += 1) {
    balance += monthlyContribution * 12;
    rows.push({ year, value: balance });
  }
  return rows;
}

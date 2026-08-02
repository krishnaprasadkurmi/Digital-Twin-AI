const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || "http://127.0.0.1:8000";

type ScenarioPayload = {
  monthly_investment_change: number;
  sleep_hours_change: number;
  weekly_study_change: number;
};

type UserPayload = {
  username: string;
  email: string;
  age?: number;
  retirement_goal_age?: number;
  target_net_worth?: number;
  monthly_income?: number;
  sleep_target_hours?: number;
  study_target_hours_week?: number;
};

type BackendUser = {
  id: number;
  username: string;
  email: string;
  age: number;
  retirement_goal_age: number;
  target_net_worth: number;
  monthly_income: number;
  sleep_target_hours: number;
  study_target_hours_week: number;
  created_at: string;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }

  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function getDefaultUser() {
  return requestJson<BackendUser>("/users/default");
}

export async function getUserByUsername(username: string) {
  return requestJson<BackendUser>(`/users/username/${encodeURIComponent(username)}`);
}

export async function getUserByEmail(email: string) {
  return requestJson<BackendUser>(`/users/email/${encodeURIComponent(email)}`);
}

export async function createUser(payload: UserPayload) {
  return requestJson<BackendUser>("/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function compareScenarios(userId: string | number, payload: {
  scenario_a: ScenarioPayload;
  scenario_b: ScenarioPayload;
  years: number;
}) {
  return requestJson(`/simulations/compare/${encodeURIComponent(String(userId))}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

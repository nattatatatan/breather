import { supabase } from "./supabase";

const API_URL = "http://localhost:8000";

export async function getCurrentUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  return response.json();
}

export async function getMeditationElements() {
  const response = await fetch(`${API_URL}/api/elements`);

  if (!response.ok) {
    throw new Error("Failed to fetch meditation elements");
  }

  return response.json();
}
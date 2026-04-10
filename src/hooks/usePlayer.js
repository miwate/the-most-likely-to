import { useMemo } from "react";

function getCookie(name) {
  return document.cookie.split("; ").reduce((acc, c) => {
    const [k, v] = c.split("=");
    return k === name ? decodeURIComponent(v) : acc;
  }, "");
}

function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Returns a stable anonymous player ID (persisted in a cookie).
 * Also exposes hasVoted / markVoted for a specific quiz.
 */
export function usePlayer() {
  const playerId = useMemo(() => {
    const existing = getCookie("qp_player_id");
    if (existing) return existing;
    const id = Math.random().toString(36).slice(2, 12);
    setCookie("qp_player_id", id);
    return id;
  }, []);

  function hasVoted(quizId) {
    return getCookie(`qp_voted_${quizId}`) === "1";
  }

  function markVoted(quizId) {
    setCookie(`qp_voted_${quizId}`, "1");
  }

  return { playerId, hasVoted, markVoted };
}

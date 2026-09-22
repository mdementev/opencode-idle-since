export type MessageLike = {
  time?: { created?: number; completed?: number }
}

export function lastMessageTime(messages: readonly MessageLike[] | undefined): number | undefined {
  const t = messages?.[messages.length - 1]?.time
  const base = t?.completed ?? t?.created
  return typeof base === "number" ? base : undefined
}

export function isIdleStatus(type: string | undefined): boolean {
  return !type || type === "idle"
}

export function nextIdle(current: number | undefined, type: string, now: number): number | undefined {
  return type === "busy" || type === "retry" ? undefined : current ?? now
}

export function formatIdleSince(t: number | undefined): string {
  return t ? `idle since ${new Date(t).toLocaleTimeString()}` : ""
}

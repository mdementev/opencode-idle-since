import { test, expect } from "bun:test"
import { testRender } from "@opentui/solid"
import plugin from "../dist/tui.js"
import { formatIdleSince, nextIdle } from "../src/idle.ts"

function makeApi({ status = { type: "idle" }, messages = [] } = {}) {
  const slots = []
  return {
    slots: { register: (s) => slots.push(s) },
    theme: { current: { textMuted: "gray" } },
    state: { session: { messages: () => messages, status: () => status } },
    event: { on: () => () => {} },
    _slots: slots,
  }
}

async function renderSlot(api) {
  await plugin.tui(api)
  const slot = api._slots[0].slots.sidebar_content
  const setup = await testRender(() => slot({}, { session_id: "ses_test" }), { width: 60, height: 3 })
  await setup.renderOnce()
  const frame = setup.captureCharFrame()
  setup.renderer.destroy?.()
  return frame
}

test("registers exactly one sidebar_content slot", async () => {
  const api = makeApi()
  await plugin.tui(api)
  expect(api._slots.length).toBe(1)
  expect(typeof api._slots[0].slots.sidebar_content).toBe("function")
})

test("renders 'idle since' when the session is idle", async () => {
  const frame = await renderSlot(makeApi())
  expect(frame).toContain("idle since")
})

test("renders nothing while the session is busy", async () => {
  const frame = await renderSlot(makeApi({ status: { type: "busy" } }))
  expect(frame).not.toContain("idle since")
})

test("nextIdle clears on busy/retry and restores on idle", () => {
  expect(nextIdle(100, "busy", 200)).toBeUndefined()
  expect(nextIdle(100, "retry", 200)).toBeUndefined()
  expect(nextIdle(undefined, "idle", 200)).toBe(200)
  expect(nextIdle(100, "idle", 200)).toBe(100)
})

test("formatIdleSince", () => {
  expect(formatIdleSince(undefined)).toBe("")
  expect(formatIdleSince(0)).toBe("")
  expect(formatIdleSince(Date.now())).toStartWith("idle since")
})

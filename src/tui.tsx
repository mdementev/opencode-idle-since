/** @jsxImportSource @opentui/solid */
import type {
  TuiPlugin,
  TuiPluginApi,
  TuiPluginModule,
  TuiSlotContext,
  TuiSlotPlugin,
} from "@opencode-ai/plugin/tui"
import { createSignal, onMount, onCleanup } from "solid-js"
import { formatIdleSince, isIdleStatus, lastMessageTime, nextIdle } from "./idle"

function initialIdle(api: TuiPluginApi, sessionID: string): number | undefined {
  const status = api.state.session.status(sessionID)
  if (!isIdleStatus(status?.type)) return undefined
  return lastMessageTime(api.state.session.messages(sessionID)) ?? Date.now()
}

function IdleSince(props: { api: TuiPluginApi; sessionID: string }) {
  const [idleSince, setIdleSince] = createSignal<number | undefined>(
    initialIdle(props.api, props.sessionID),
  )

  onMount(() => {
    const offStatus = props.api.event.on("session.status", (e) => {
      if (e.properties.sessionID !== props.sessionID) return
      setIdleSince((current) => nextIdle(current, e.properties.status.type, Date.now()))
    })
    const offIdle = props.api.event.on("session.idle", (e) => {
      if (e.properties.sessionID === props.sessionID) {
        setIdleSince((current) => current ?? Date.now())
      }
    })

    onCleanup(() => {
      offStatus()
      offIdle()
    })
  })

  return <text fg={props.api.theme.current.textMuted}>{formatIdleSince(idleSince())}</text>
}

function createIdleSlot(api: TuiPluginApi): TuiSlotPlugin {
  return {
    order: 90,
    slots: {
      sidebar_content(_ctx: TuiSlotContext, props: { session_id: string }) {
        return <IdleSince api={api} sessionID={props.session_id} />
      },
    },
  }
}

const tui: TuiPlugin = async (api) => {
  api.slots.register(createIdleSlot(api))
}

const plugin: TuiPluginModule & { id: string } = {
  id: "idle-since",
  tui,
}

export default plugin

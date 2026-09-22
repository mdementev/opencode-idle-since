/** @jsxImportSource @opentui/solid */
import type {
  TuiPlugin,
  TuiPluginApi,
  TuiPluginModule,
  TuiSlotContext,
  TuiSlotPlugin,
} from "@opencode-ai/plugin/tui"
import { createSignal, onMount, onCleanup } from "solid-js"

function lastMsgTime(api: TuiPluginApi, sessionID: string): number | undefined {
  const msgs = api.state.session.messages(sessionID)
  const t = msgs?.[msgs.length - 1]?.time as { created?: number; completed?: number } | undefined
  const base = t?.completed ?? t?.created
  return typeof base === "number" ? base : undefined
}

function IdleSince(props: { api: TuiPluginApi; sessionID: string }) {
  const [idleSince, setIdleSince] = createSignal<number>()

  onMount(() => {
    const status = props.api.state.session.status(props.sessionID)
    if (!status || status.type === "idle") {
      setIdleSince(lastMsgTime(props.api, props.sessionID) ?? Date.now())
    }

    const offStatus = props.api.event.on("session.status", (e) => {
      if (e.properties.sessionID !== props.sessionID) return
      const type = e.properties.status.type
      setIdleSince(type === "busy" || type === "retry" ? undefined : Date.now())
    })
    const offIdle = props.api.event.on("session.idle", (e) => {
      if (e.properties.sessionID === props.sessionID) setIdleSince((v) => v ?? Date.now())
    })

    onCleanup(() => {
      offStatus()
      offIdle()
    })
  })

  const label = () => {
    const t = idleSince()
    return t ? `idle since ${new Date(t).toLocaleTimeString()}` : ""
  }

  return <text fg={props.api.theme.current.textMuted}>{label()}</text>
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

import { Client } from '@xhayper/discord-rpc'

let rpc: Client | null = null
let isConnected = false

// Custom Client ID registered for CaféVerse
const CLIENT_ID = '1509629127559348414'

export function initDiscordRPC(): void {
  if (rpc) return

  console.log('[Discord RPC] Initializing Discord Rich Presence...')
  rpc = new Client({ clientId: CLIENT_ID })

  rpc.on('ready', () => {
    console.log('[Discord RPC] Connected to Discord client successfully!')
    isConnected = true
  })

  rpc.on('disconnected', () => {
    console.log('[Discord RPC] Disconnected from Discord.')
    isConnected = false
  })

  // Attempt async login to local Discord application client
  rpc.login().catch((err) => {
    console.warn('[Discord RPC] Failed to connect/login to Discord client:', err.message)
    isConnected = false
  })
}

export interface DiscordActivityPayload {
  details?: string
  state?: string
  startTimestamp?: number
  largeImageKey?: string
  largeImageText?: string
  smallImageKey?: string
  smallImageText?: string
}

export function updateDiscordActivity(activity: DiscordActivityPayload): void {
  if (!rpc || !isConnected) {
    // If client instance is missing, attempt to lazy-initialize
    if (!rpc) {
      initDiscordRPC()
    }
    return
  }

  try {
    rpc.user
      ?.setActivity({
        details: activity.details,
        state: activity.state,
        // Convert Unix epoch ms to Date
        startTimestamp: activity.startTimestamp ? new Date(activity.startTimestamp) : undefined,
        largeImageKey: activity.largeImageKey || 'logo',
        largeImageText: activity.largeImageText || 'CaféVerse',
        smallImageKey: activity.smallImageKey,
        smallImageText: activity.smallImageText
      })
      .catch((err) => {
        console.error('[Discord RPC] Failed to set activity:', err)
      })
  } catch (err) {
    console.error('[Discord RPC] Error trying to update activity:', err)
  }
}

export function clearDiscordActivity(): void {
  if (!rpc || !isConnected) return
  try {
    rpc.user?.clearActivity().catch((err) => {
      console.error('[Discord RPC] Failed to clear activity:', err)
    })
  } catch (err) {
    console.error('[Discord RPC] Error trying to clear activity:', err)
  }
}

export function shutdownDiscordRPC(): void {
  if (!rpc) return
  console.log('[Discord RPC] Shutting down Discord RPC client...')
  try {
    rpc.destroy()
  } catch (err) {
    console.error('[Discord RPC] Error during shutdown:', err)
  }
  rpc = null
  isConnected = false
}

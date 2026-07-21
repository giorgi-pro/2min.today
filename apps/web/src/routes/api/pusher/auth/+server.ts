import { env } from '@config/env'
import { logger } from '@logging'
import { error, json } from '@sveltejs/kit'
import { randomUUID } from 'node:crypto'
import Pusher from 'pusher'
import type { RequestHandler } from './$types'

// Authorizes the browser to join a presence channel (Pusher's client SDK
// calls this automatically). No app secret ever reaches the browser: this
// route signs the join server-side with PUSHER_APP_SECRET.
export const POST: RequestHandler = async ({ request }) => {
  if (!env.PUSHER_APP_ID || !env.PUSHER_APP_SECRET || !env.PUBLIC_PUSHER_APP_KEY || !env.PUBLIC_PUSHER_CLUSTER) {
    throw error(501, 'Pusher not configured')
  }

  const form = await request.formData()
  const socketId = form.get('socket_id')
  const channelName = form.get('channel_name')

  if (typeof socketId !== 'string' || typeof channelName !== 'string') {
    throw error(400, 'socket_id and channel_name are required')
  }
  if (!channelName.startsWith('presence-')) {
    throw error(403, 'only presence channels are allowed')
  }

  const pusher = new Pusher({
    appId: env.PUSHER_APP_ID,
    key: env.PUBLIC_PUSHER_APP_KEY,
    secret: env.PUSHER_APP_SECRET,
    cluster: env.PUBLIC_PUSHER_CLUSTER,
    useTLS: true,
  })

  // No real user accounts: each browser tab is its own anonymous presence member.
  const authResponse = pusher.authorizeChannel(socketId, channelName, {
    user_id: randomUUID(),
  })

  logger.debug({ channelName }, 'pusher presence auth granted')

  return json(authResponse)
}

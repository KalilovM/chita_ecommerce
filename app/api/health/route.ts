import { NextResponse } from 'next/server'

// Lightweight health check — no DB calls, no auth.
// Used by Docker HEALTHCHECK to determine if the container is ready.
export async function GET() {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    { status: 200 }
  )
}

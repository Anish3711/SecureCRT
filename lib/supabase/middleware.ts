import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Simple pass-through middleware - no session management needed
  return NextResponse.next({
    request,
  })
}

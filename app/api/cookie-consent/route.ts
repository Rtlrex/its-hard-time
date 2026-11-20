import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (body.choice !== 'accepted' && body.choice !== 'essential') {
      return NextResponse.json({ error: 'Choose a valid cookie preference.' }, { status: 400 })
    }
    const response = NextResponse.json({ saved: true })
    response.cookies.set('northline_consent', body.choice, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 180,
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Unable to save your cookie preference.' }, { status: 400 })
  }
}

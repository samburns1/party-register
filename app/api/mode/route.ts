import { NextResponse } from 'next/server';

export async function GET() {
  const registrationMode = process.env.REGISTRATION_MODE || 'SMS';
  return NextResponse.json({ mode: registrationMode });
}
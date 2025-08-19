import { NextResponse } from 'next/server';

export async function GET() {
  // Debug email-related environment variables
  const emailDebug = {
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'SET' : 'MISSING',
    FROM_EMAIL: process.env.FROM_EMAIL || 'MISSING',
    REDIS_URL: process.env.REDIS_URL ? 'SET' : 'MISSING',
    isDemoMode: !process.env.SENDGRID_API_KEY || !process.env.REDIS_URL,
    allEmailKeys: Object.keys(process.env).filter(key => 
      key.includes('SENDGRID') || 
      key.includes('FROM_EMAIL') ||
      key.includes('REDIS')
    ),
  };
  
  return NextResponse.json(emailDebug);
}
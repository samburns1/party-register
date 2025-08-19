import { NextResponse } from 'next/server';

export async function GET() {
  // Check SendGrid configuration
  const sendgridStatus = {
    SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'SET' : 'MISSING',
    FROM_EMAIL: process.env.FROM_EMAIL || 'MISSING',
    REDIS_URL: process.env.REDIS_URL ? 'SET' : 'MISSING',
    isDemoMode: !process.env.SENDGRID_API_KEY || !process.env.REDIS_URL,
    webhookUrl: 'https://1306.space/api/email/inbound',
    expectedReplyTo: 'replies@mail.1306.space'
  };
  
  return NextResponse.json(sendgridStatus);
}
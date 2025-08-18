import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { kv } from '@vercel/kv';

const CHAR_LIMIT = 40;

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    
    // Validate E.164 format (+1XXXXXXXXXX, 10-15 digits)
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use E.164 format (+1XXXXXXXXXX)' },
        { status: 400 }
      );
    }

    // Check if we're in demo mode (missing env vars)
    const isDemoMode = !process.env.TWILIO_ACCOUNT_SID || !process.env.KV_REST_API_URL;
    
    if (isDemoMode) {
      console.log(`[DEMO MODE] Would send SMS to ${phone}: "thanks, whats your first and last name"`);
      return NextResponse.json({ ok: true, limit: CHAR_LIMIT, demo: true });
    }

    // Set state in KV store (expires in 24 hours)
    await kv.set(`party:state:${phone}`, 'awaiting_name', { ex: 86400 });

    // Send SMS
    await client.messages.create({
      to: phone,
      from: process.env.TWILIO_FROM_NUMBER,
      body: 'thanks, whats your first and last name'
    });

    return NextResponse.json({ ok: true, limit: CHAR_LIMIT });
  } catch (error) {
    console.error('SMS sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
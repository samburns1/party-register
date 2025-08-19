import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from 'redis';
import { saveResponseToLocalCSV } from '../../utils/saveLocal';

const CHAR_LIMIT = 40;

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;

    if (!from || !body) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Handle STOP/START/HELP keywords
    const normalizedBody = body.trim().toUpperCase();
    
    if (normalizedBody === 'STOP' || normalizedBody === 'UNSUBSCRIBE') {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been unsubscribed from party updates. Reply START to opt back in.</Message></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }
    
    if (normalizedBody === 'START' || normalizedBody === 'SUBSCRIBE') {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>You have been subscribed to party updates. Tap the link again and enter your number to register.</Message></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }
    
    if (normalizedBody === 'HELP') {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Party RSVP system. Reply STOP to unsubscribe or visit our website to register.</Message></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Connect to Redis
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();

    // Check if user is in awaiting_name state
    const state = await redis.get(`party:state:${from}`);
    if (state !== 'awaiting_name') {
      await redis.disconnect();
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Hi! Tap the link again and enter your number to begin.</Message></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Check character limit
    if (body.length > CHAR_LIMIT) {
      await redis.disconnect();
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Name is too long. Please reply with first and last name under 40 characters.</Message></Response>',
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Store the RSVP
    const rsvpData = {
      phone: from,
      name: body.trim(),
      ts: new Date().toISOString()
    };
    
    await redis.lPush('party:rsvps', JSON.stringify(rsvpData));
    
    // Also save to local CSV file (gitignored)
    saveResponseToLocalCSV(from, body.trim(), rsvpData.ts);
    
    // Clear the state
    await redis.del(`party:state:${from}`);
    await redis.disconnect();

    // Send confirmation
    const confirmationMessage = `Got it, thanks ${body.trim()}! You're all set 🎉`;
    
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${confirmationMessage}</Message></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
    
  } catch (error) {
    console.error('Inbound SMS processing error:', error);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Sorry, there was an error processing your message. Please try again.</Message></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }
}
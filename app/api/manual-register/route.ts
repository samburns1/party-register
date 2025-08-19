import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';
import { saveResponseToLocalCSV } from '../../../../utils/saveLocal';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    
    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name required' }, { status: 400 });
    }

    // Store the RSVP directly
    const rsvpData = {
      email: email,
      name: name,
      ts: new Date().toISOString()
    };
    
    console.log('Manual RSVP:', rsvpData);

    // Save to Redis
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    await redis.lPush('party:rsvps', JSON.stringify(rsvpData));
    await redis.disconnect();
    
    // Save to local CSV
    saveResponseToLocalCSV(email, name, rsvpData.ts);
    
    return NextResponse.json({ success: true, message: 'Registration saved' });
    
  } catch (error) {
    console.error('Manual registration error:', error);
    return NextResponse.json({ error: 'Failed to save registration' }, { status: 500 });
  }
}
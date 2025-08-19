import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function GET() {
  try {
    if (!process.env.REDIS_URL) {
      return NextResponse.json({ error: 'Redis not configured' });
    }

    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    
    // Get all registrations
    const rsvps = await redis.lRange('party:rsvps', 0, -1);
    
    await redis.disconnect();
    
    // Parse and return all registrations
    const parsed = rsvps.map((rsvp, index) => {
      try {
        return { index, data: JSON.parse(rsvp) };
      } catch (error) {
        return { index, error: 'Parse error', raw: rsvp };
      }
    });

    return NextResponse.json({
      total: rsvps.length,
      registrations: parsed
    });
    
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to fetch registrations',
      message: error.message 
    });
  }
}
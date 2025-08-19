import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function GET() {
  try {
    console.log('Testing Redis connection...');
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    
    // Test write
    await redis.set('test:key', 'test-value');
    const value = await redis.get('test:key');
    
    // Check existing data
    const rsvps = await redis.lRange('party:rsvps', 0, -1);
    
    await redis.disconnect();
    
    return NextResponse.json({
      redis_connected: true,
      test_value: value,
      existing_rsvps: rsvps.length,
      rsvp_data: rsvps
    });
    
  } catch (error) {
    return NextResponse.json({
      redis_connected: false,
      error: error.message
    });
  }
}
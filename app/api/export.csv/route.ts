import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function GET(request: NextRequest) {
  try {
    // Check if Redis is available
    if (!process.env.REDIS_URL) {
      return new NextResponse('phone,name,timestamp\n', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="party_rsvps.csv"',
        },
      });
    }

    // Connect to Redis and get all RSVPs from the list
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    const rsvps = await redis.lRange('party:rsvps', 0, -1);
    await redis.disconnect();
    
    // Create CSV header
    let csvContent = 'phone,name,timestamp\n';
    
    // Process each RSVP
    for (const rsvpJson of rsvps) {
      try {
        const rsvp = JSON.parse(rsvpJson as string);
        // Escape any commas in names by wrapping in quotes
        const escapedName = rsvp.name.includes(',') ? `"${rsvp.name}"` : rsvp.name;
        csvContent += `${rsvp.phone},${escapedName},${rsvp.ts}\n`;
      } catch (parseError) {
        console.error('Error parsing RSVP JSON:', parseError);
        // Skip malformed entries
        continue;
      }
    }
    
    // Return CSV with appropriate headers
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="party_rsvps.csv"',
      },
    });
    
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}
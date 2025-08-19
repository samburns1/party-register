import { NextRequest, NextResponse } from 'next/server';

// In-memory storage (will reset on deployment, but works for testing)
let registrations: Array<{email: string, name: string, timestamp: string}> = [];

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    
    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name required' }, { status: 400 });
    }

    const registration = {
      email: email,
      name: name,
      timestamp: new Date().toISOString()
    };
    
    registrations.push(registration);
    console.log('Registration saved:', registration);
    console.log('Total registrations:', registrations.length);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Registration saved',
      total: registrations.length 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to save registration' }, { status: 500 });
  }
}

export async function GET() {
  // Return CSV format
  let csv = 'contact,name,timestamp,type\n';
  for (const reg of registrations) {
    csv += `"${reg.email}","${reg.name}","${reg.timestamp}","EMAIL"\n`;
  }
  
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="party_rsvps.csv"'
    }
  });
}
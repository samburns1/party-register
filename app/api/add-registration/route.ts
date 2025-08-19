import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CSV_FILE = path.join(process.cwd(), 'registrations.csv');

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();
    
    if (!email || !name) {
      return NextResponse.json({ error: 'Email and name required' }, { status: 400 });
    }

    // Create CSV if it doesn't exist
    if (!fs.existsSync(CSV_FILE)) {
      fs.writeFileSync(CSV_FILE, 'contact,name,timestamp,type\n');
    }

    // Add registration
    const timestamp = new Date().toISOString();
    const csvRow = `"${email}","${name}","${timestamp}","EMAIL"\n`;
    fs.appendFileSync(CSV_FILE, csvRow);
    
    console.log(`Added registration: ${email} - ${name}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Registration saved to CSV'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Failed to save registration' }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (!fs.existsSync(CSV_FILE)) {
      return new Response('contact,name,timestamp,type\n', {
        headers: { 'Content-Type': 'text/csv' }
      });
    }

    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="party_registrations.csv"'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read registrations' }, { status: 500 });
  }
}
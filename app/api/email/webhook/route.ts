import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';
import sgMail from '@sendgrid/mail';
import { saveResponseToLocalCSV } from '../../../../utils/saveLocal';

const CHAR_LIMIT = 40;

export async function GET() {
  return NextResponse.json({ 
    message: 'SendGrid inbound email webhook endpoint (alternative)',
    method: 'POST',
    status: 'ready'
  });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== WEBHOOK CALLED (alternative endpoint) ===');
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('Method:', request.method);
    
    // Handle SendGrid inbound email webhook
    const formData = await request.formData();
    
    // Log all form data for debugging
    console.log('SendGrid webhook received:', Object.fromEntries(formData.entries()));
    
    // SendGrid webhook format
    const fromEmail = formData.get('from') as string;
    const emailBody = formData.get('text') as string;
    
    if (!fromEmail || !emailBody) {
      console.error('Missing email data:', { fromEmail, emailBody });
      return NextResponse.json({ error: 'Missing email data' }, { status: 400 });
    }

    console.log(`Processing email from ${fromEmail} with body: ${emailBody.substring(0, 50)}...`);

    // Connect to Redis
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();

    // Check if user is in awaiting_name state
    const state = await redis.get(`party:state:${fromEmail}`);
    if (state !== 'awaiting_name') {
      await redis.disconnect();
      console.log('User not in awaiting_name state:', state);
      return NextResponse.json({ message: 'Email processed - not in registration flow' });
    }

    // Clean up the email body
    const cleanedName = emailBody.split('\n')[0].trim();
    console.log('Cleaned name:', cleanedName);

    // Check character limit
    if (cleanedName.length > CHAR_LIMIT) {
      await redis.disconnect();
      console.log('Name too long:', cleanedName.length);
      return NextResponse.json({ message: 'Name too long' });
    }

    // Store the RSVP
    const rsvpData = {
      email: fromEmail,
      name: cleanedName,
      ts: new Date().toISOString()
    };
    
    console.log('Saving RSVP:', rsvpData);
    await redis.lPush('party:rsvps', JSON.stringify(rsvpData));
    console.log('RSVP saved to Redis successfully');
    
    // Also save to local CSV file (gitignored)
    saveResponseToLocalCSV(fromEmail, cleanedName, rsvpData.ts);
    console.log('RSVP saved to local CSV successfully');
    
    // Clear the state
    await redis.del(`party:state:${fromEmail}`);
    await redis.disconnect();
    console.log('Registration completed successfully for:', fromEmail);

    return NextResponse.json({ message: 'Registration completed successfully' });
    
  } catch (error) {
    console.error('Inbound email processing error:', error);
    return NextResponse.json({ error: 'Failed to process email' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';
import sgMail from '@sendgrid/mail';
import { saveResponseToLocalCSV } from '../../../utils/saveLocal';

const CHAR_LIMIT = 40;

export async function POST(request: NextRequest) {
  try {
    // Handle SendGrid inbound email webhook
    // SendGrid sends form data, not JSON
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
      
      // Send auto-reply
      await sendAutoReply(fromEmail, "Hi! Please visit our registration site to begin the RSVP process.");
      
      return NextResponse.json({ message: 'Email processed - not in registration flow' });
    }

    // Clean up the email body (remove signatures, quotes, etc.)
    const cleanedName = cleanEmailBody(emailBody);

    // Check character limit
    if (cleanedName.length > CHAR_LIMIT) {
      await redis.disconnect();
      
      await sendAutoReply(fromEmail, `Name is too long. Please reply with first and last name under ${CHAR_LIMIT} characters.`);
      
      return NextResponse.json({ message: 'Name too long - auto-reply sent' });
    }

    // Store the RSVP
    const rsvpData = {
      email: fromEmail,
      name: cleanedName,
      ts: new Date().toISOString()
    };
    
    await redis.lPush('party:rsvps', JSON.stringify(rsvpData));
    
    // Also save to local CSV file (gitignored)
    saveResponseToLocalCSV(fromEmail, cleanedName, rsvpData.ts);
    
    // Clear the state
    await redis.del(`party:state:${fromEmail}`);
    await redis.disconnect();

    // Send confirmation email
    await sendAutoReply(fromEmail, `Got it, thanks ${cleanedName}! You're all set 🎉`);

    return NextResponse.json({ message: 'Registration completed successfully' });
    
  } catch (error) {
    console.error('Inbound email processing error:', error);
    return NextResponse.json({ error: 'Failed to process email' }, { status: 500 });
  }
}

function cleanEmailBody(body: string): string {
  // Remove common email artifacts
  let cleaned = body
    .split('\n')[0] // Take first line only
    .replace(/^(Re:|RE:|Fwd:|FWD:)/i, '') // Remove reply prefixes
    .replace(/On.*wrote:/g, '') // Remove "On [date] wrote:" lines
    .replace(/From:.*$/gm, '') // Remove "From:" lines
    .replace(/Sent from my.*/i, '') // Remove "Sent from my iPhone" etc
    .trim();
  
  return cleaned;
}

async function sendAutoReply(toEmail: string, message: string) {
  try {
    if (!process.env.SENDGRID_API_KEY) return; // Skip in demo mode

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: toEmail,
      from: process.env.FROM_EMAIL!,
      subject: 'Party Registration Update',
      text: message,
    });
  } catch (error) {
    console.error('Failed to send auto-reply:', error);
  }
}
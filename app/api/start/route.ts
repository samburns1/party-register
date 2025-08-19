import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from 'redis';
import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

const CHAR_LIMIT = 40;

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    const { contact } = await request.json(); // Now accepts email or phone
    
    const registrationMode = process.env.REGISTRATION_MODE || 'SMS';
    
    console.log(`Registration mode: ${registrationMode}, Contact: ${contact}`);
    
    if (registrationMode === 'EMAIL') {
      return await handleEmailFlow(contact);
    } else {
      return await handleSMSFlow(contact);
    }
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to send registration request' },
      { status: 500 }
    );
  }
}

async function handleEmailFlow(email: string) {
  // Validate USC email
  const uscEmailRegex = /^[a-zA-Z0-9._%+-]+@usc\.edu$/;
  if (!uscEmailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Please use a valid USC email address (@usc.edu)' },
      { status: 400 }
    );
  }

  // Check if we're in demo mode
  const isDemoMode = !process.env.SENDGRID_API_KEY || !process.env.REDIS_URL;
  
  if (isDemoMode) {
    console.log(`[DEMO MODE] Would send email to ${email}: Name request`);
    return NextResponse.json({ ok: true, limit: CHAR_LIMIT, demo: true, mode: 'EMAIL' });
  }

  // Save the registration immediately (no need to wait for reply)
  const rsvpData = {
    email: email,
    name: 'Pending', // Will be updated if they reply with name
    ts: new Date().toISOString()
  };

  if (process.env.REDIS_URL) {
    try {
      const redis = createClient({ url: process.env.REDIS_URL });
      await redis.connect();
      await redis.lPush('party:rsvps', JSON.stringify(rsvpData));
      await redis.disconnect();
      console.log('Registration saved to Redis');
    } catch (error) {
      console.error('Redis save failed:', error);
    }
  }

  // Send email via SendGrid
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  
  console.log(`Sending registration email to ${email} from ${process.env.FROM_EMAIL}`);
  
  await sgMail.send({
    to: email,
    from: process.env.FROM_EMAIL!, // Must be verified sender in SendGrid
    subject: 'Party Registration Confirmation 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #8B7D7A; text-align: center;">You're Registered! 🎉</h2>
        
        <p style="font-size: 16px; line-height: 1.5;">
          Thanks for registering with your USC email! You're all set for the party.
        </p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #8B7D7A;">📍 Event Details</h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> [INSERT DATE]</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> [INSERT TIME]</p>
          <p style="margin: 5px 0;"><strong>Location:</strong> [INSERT LOCATION ADDRESS]</p>
          <p style="margin: 5px 0;"><strong>Dress Code:</strong> [INSERT DRESS CODE]</p>
        </div>
        
        <p style="font-size: 16px; line-height: 1.5;">
          We can't wait to see you there! If you have any questions, just reply to this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This is an automated confirmation. Your registration is complete.
        </p>
      </div>
    `,
  });

  console.log(`Registration email sent successfully to ${email}`);

  return NextResponse.json({ ok: true, limit: CHAR_LIMIT, mode: 'EMAIL' });
}

async function handleSMSFlow(phone: string) {
  // Validate E.164 format (+1XXXXXXXXXX, 10-15 digits)
  const phoneRegex = /^\+[1-9]\d{9,14}$/;
  if (!phoneRegex.test(phone)) {
    return NextResponse.json(
      { error: 'Invalid phone number format. Use E.164 format (+1XXXXXXXXXX)' },
      { status: 400 }
    );
  }

  // Check if we're in demo mode (missing env vars)
  const isDemoMode = !process.env.TWILIO_ACCOUNT_SID || !process.env.REDIS_URL;
  
  if (isDemoMode) {
    console.log(`[DEMO MODE] Would send SMS to ${phone}: "thanks, whats your first and last name"`);
    return NextResponse.json({ ok: true, limit: CHAR_LIMIT, demo: true, mode: 'SMS' });
  }

  // Connect to Redis and set state (expires in 24 hours)
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();
  await redis.setEx(`party:state:${phone}`, 86400, 'awaiting_name');
  await redis.disconnect();

  // Send SMS
  await client.messages.create({
    to: phone,
    from: process.env.TWILIO_FROM_NUMBER,
    body: 'thanks, whats your first and last name'
  });

  return NextResponse.json({ ok: true, limit: CHAR_LIMIT, mode: 'SMS' });
}
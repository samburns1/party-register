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

  // Connect to Redis and set state
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();
  await redis.setEx(`party:state:${email}`, 86400, 'awaiting_name');
  await redis.disconnect();

  // Send email via SendGrid
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
  
  await sgMail.send({
    to: email,
    from: process.env.FROM_EMAIL!, // Must be verified sender in SendGrid
    subject: 'Complete Your Party Registration',
    html: `
      <h2>Thanks for registering!</h2>
      <p>Please <strong>reply to this email</strong> with your first and last name to complete your registration.</p>
      <p><em>Keep it under ${CHAR_LIMIT} characters.</em></p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        This is an automated message. Simply reply with your name.
      </p>
    `,
  });

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
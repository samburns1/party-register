import { NextResponse } from 'next/server';

export async function GET() {
  // Debug all environment variables
  const envVars = {
    REGISTRATION_MODE: process.env.REGISTRATION_MODE,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    // Check if any other env vars are present
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('REGISTRATION') || 
      key.includes('TWILIO') || 
      key.includes('SENDGRID') ||
      key.includes('REDIS')
    ),
  };
  
  return NextResponse.json(envVars);
}
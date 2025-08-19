import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';
import sgMail from '@sendgrid/mail';

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json();
    
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
    }

    // Validate USC email
    const uscEmailRegex = /^[a-zA-Z0-9._%+-]+@usc\.edu$/;
    if (!uscEmailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Please use a valid USC email address (@usc.edu)' 
      }, { status: 400 });
    }

    // Save registration and send to private email
    const rsvpData = {
      email: email,
      name: name,
      ts: new Date().toISOString()
    };

    console.log('Registration received:', rsvpData);

    // Send registration data to your private email immediately
    if (process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL) {
      const csvData = `contact,name,timestamp,type\n"${email}","${name}","${rsvpData.ts}","EMAIL"`;
      
      try {
        await sgMail.send({
          to: 'samuel.b.burns@gmail.com', // Send to your email
          from: process.env.FROM_EMAIL,
          subject: `New Party Registration: ${name}`,
          text: `New registration:\nName: ${name}\nEmail: ${email}\nTime: ${rsvpData.ts}`,
          attachments: [{
            content: Buffer.from(csvData).toString('base64'),
            filename: `registration-${Date.now()}.csv`,
            type: 'text/csv',
            disposition: 'attachment'
          }]
        });
        console.log('Registration data sent to private email');
      } catch (error) {
        console.error('Failed to send registration data:', error);
      }
    }

    // Also try to save to Redis if available
    if (process.env.REDIS_URL) {
      try {
        const redis = createClient({ url: process.env.REDIS_URL });
        await redis.connect();
        await redis.lPush('party:rsvps', JSON.stringify(rsvpData));
        await redis.disconnect();
        console.log('Registration also saved to database');
      } catch (error) {
        console.error('Redis save failed (but email sent):', error);
      }
    }

    // Send confirmation email
    if (process.env.SENDGRID_API_KEY && process.env.FROM_EMAIL) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      await sgMail.send({
        to: email,
        from: process.env.FROM_EMAIL,
        subject: 'Party Registration Confirmation 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #8B7D7A; text-align: center;">Hey ${name}, You're Registered! 🎉</h2>
            
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

      console.log(`Confirmation email sent to ${email}`);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Registration complete'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      error: 'Failed to complete registration' 
    }, { status: 500 });
  }
}
# Party Register

A Next.js app for collecting party RSVPs via SMS/Email using Twilio/SendGrid and Redis. 🎉

## Features

- 3-state mobile-first UI (icon → phone input → confirmation)
- SMS-based name collection with 40-character limit
- Twilio webhook handling for inbound SMS
- CSV export of all RSVPs
- STOP/START/HELP keyword compliance

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:
- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token  
- `TWILIO_FROM_NUMBER` - Your Twilio phone number (+1XXXXXXXXXX)
- `KV_REST_API_URL` - Vercel KV REST API URL
- `KV_REST_API_TOKEN` - Vercel KV REST API Token

### 2. Install Dependencies

```bash
npm install
```

### 3. Development

```bash
npm run dev
```

### 4. Twilio Webhook Setup

For development, use ngrok:
```bash
ngrok http 3000
```

In Twilio Console → Messaging → Your Number → Webhook URL:
```
https://your-ngrok-url.ngrok.io/api/twilio/inbound
```

For production, use your Vercel deployment URL:
```
https://your-app.vercel.app/api/twilio/inbound
```

## API Endpoints

- `POST /api/start` - Send initial SMS
- `POST /api/twilio/inbound` - Twilio webhook for replies
- `GET /api/export.csv` - Download CSV of RSVPs

## Design Reference

Visit `/design` to see the Figma reference. Replace the placeholder SVGs in `/public` with exported assets from Figma Dev Mode:

- `public/first-icon.svg` - Main tappable icon
- `public/house.svg` - Bottom-right decoration

## Deployment

Deploy to Vercel and set up Vercel KV in your project dashboard. Environment variables must be configured in Vercel project settings.

## Testing

1. **UI Flow**: Click icon → enter phone → submit → see confirmation
2. **SMS**: Receive "thanks, whats your first and last name"
3. **Reply Handling**: 
   - Valid name → confirmation + stored in KV
   - Long name → "too long" message
   - HELP/STOP/START → appropriate responses
4. **CSV Export**: Visit `/api/export.csv` to download data
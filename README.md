# Solana Pay Payment Gateway

A Next.js application that enables merchants to accept payments in USDC while allowing customers to pay with their token of choice through Jupiter's exact-out swap feature.

## Features

- Accept USDC payments as a merchant
- Allow customers to pay with any verified token on Jupiter (BONK, JUP, TRUMP, etc.)
- Generate Solana Pay QR codes for seamless mobile wallet payments
- Automatic token swaps during transaction (in-flight, exact out swap)
- Simple and intuitive user interface

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Solana wallet (Phantom, Solflare, etc.)

## Installation

1. Clone the repository
```bash
git clone https://github.com/cutemonstersnft/payment-gateway-st.git
cd payment-gateway
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Download and install ngrok CLI
   - Visit [ngrok.com](https://ngrok.com/) to download
   - Follow their installation instructions for your operating system

4. Configure RPC URLs
   - Open `qr.tsx` and replace the RPC URL on line 45 with your own
   - Open `checkout/route.tsx` and replace the RPC URL on line 72 with your own

## Running the Application

1. Start the development server
```bash
npm run dev
# or
yarn dev
```

2. In a separate terminal, start ngrok to expose your local server
```bash
ngrok http 3000
```

3. Navigate to the ngrok URL provided in the terminal

## How to Use

1. Navigate to the ngrok URL in your browser

2. Fill in the payment details:
   - Amount in USDC
   - Recipient public key (must have a USDC token account)
   - Token of choice (search for symbols like BONK, JUP, or TRUMP - must be from Jupiter's verified list)

3. Click "Checkout" to generate a Solana Pay QR code

4. Scan the QR code with your Solana wallet (Phantom, Solflare, etc.)

5. Approve the transaction in your wallet

6. Transaction complete! You can inspect the Solana transaction to see the in-flight swap

## How It Works

When a customer makes a payment:
1. They select their preferred token for payment
2. The system calculates the equivalent amount based on current market rates
3. During the transaction, an in-flight swap occurs (exact out)
4. The customer's selected token is debited from their wallet
5. The merchant receives the exact USDC amount requested

It's like magic! The merchant always receives USDC regardless of what token the customer uses to pay.

## Deployment to Production

Once your application is ready for production, you can easily deploy it using either Netlify or Vercel:

### Vercel (Recommended)

1. Install the Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy to production:
```bash
vercel --prod
```

3. Follow the prompts to complete the deployment process.

### Netlify

1. Install the Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Deploy to Netlify:
```bash
netlify deploy --prod
```

3. Follow the prompts to complete the deployment process.

Both platforms offer continuous deployment from Git repositories, custom domains, and SSL certificates.

## Troubleshooting

- Ensure your RPC URLs are valid and have sufficient rate limits
- Make sure the recipient wallet has a USDC token account
- Verify that you have sufficient balance in your wallet for the transaction

## License

[MIT](LICENSE)
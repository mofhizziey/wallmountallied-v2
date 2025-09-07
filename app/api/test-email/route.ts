// pages/api/test-email.ts or app/api/test-email/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { emailService } from '@/lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, firstName = 'Test', lastName = 'User' } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const result = await emailService.handleNewUserRegistration({
      firstName,
      lastName,
      email,
      accountNumber: 'TEST-' + Date.now()
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error sending test emails', 
      error: error.message 
    });
  }
}

// Test with curl:
// curl -X POST http://localhost:3000/api/test-email \
//   -H "Content-Type: application/json" \
//   -d '{"email":"your-email@example.com","firstName":"John","lastName":"Doe"}'
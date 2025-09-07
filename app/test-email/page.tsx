// pages/test-email.tsx or app/test-email/page.tsx
"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// In your signup component, replace the import:
import { sendGridEmailService as emailService } from '@/lib/email-service-sendgrid'


export default function EmailTestPage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEmails = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const testData = {
        firstName: firstName || 'John',
        lastName: lastName || 'Doe',
        email: email,
        accountNumber: '1234567890'
      };

      const emailResult = await emailService.handleNewUserRegistration(testData);
      setResult(emailResult);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Email Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Test email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <Input
            placeholder="First name (optional)"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <Input
            placeholder="Last name (optional)"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <Button 
            onClick={testEmails} 
            disabled={!email || isLoading}
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Test Send Emails'}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-medium mb-2">Test Results:</h3>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
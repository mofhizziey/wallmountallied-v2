// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');

// Read users from JSON file
async function readUsers() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write users to JSON file
async function writeUsers(users: any[]) {
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
}

// POST - Authenticate user credentials
export async function POST(request: NextRequest) {
  try {
    const { email, password, step = 'credentials' } = await request.json();
    const users = await readUsers();

    const user = users.find((u: any) => u.email === email);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is suspended. Please contact support.' },
        { status: 403 }
      );
    }

    if (step === 'credentials') {
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return NextResponse.json(
          { success: false, error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Return user without sensitive data for PIN step
      const { password: _, ssn, pin, ...safeUser } = user;
      
      return NextResponse.json({
        success: true,
        user: safeUser,
        message: 'Credentials verified'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid step' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error during authentication:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
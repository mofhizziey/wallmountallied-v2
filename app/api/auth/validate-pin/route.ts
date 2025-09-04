// app/api/auth/validate-pin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

// POST - Validate PIN
export async function POST(request: NextRequest) {
  try {
    const { userId, pin } = await request.json();
    
    if (!userId || !pin) {
      return NextResponse.json(
        { success: false, error: 'User ID and PIN are required' },
        { status: 400 }
      );
    }

    const users = await readUsers();
    const userIndex = users.findIndex((u: any) => u.id === userId);
    
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[userIndex];

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is suspended. Please contact support.' },
        { status: 403 }
      );
    }

    // Validate PIN
    if (user.pin !== pin) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Update last login
    users[userIndex].lastLogin = new Date().toISOString();
    await writeUsers(users);

    // Return user without sensitive data
    const { password, ssn, pin: _, ...safeUser } = users[userIndex];
    
    return NextResponse.json({
      success: true,
      user: safeUser,
      message: 'PIN validated successfully'
    });

  } catch (error) {
    console.error('Error validating PIN:', error);
    return NextResponse.json(
      { success: false, error: 'PIN validation failed' },
      { status: 500 }
    );
  }
}
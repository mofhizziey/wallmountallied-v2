// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read users from JSON file
async function readUsers() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Write users to JSON file
async function writeUsers(users: any[]) {
  await ensureDataDirectory();
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate account number
function generateAccountNumber() {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();
    const users = await readUsers();

    // Check if user already exists
    const existingUser = users.find((user: any) => user.email === userData.email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Create new user
    const newUser = {
      id: generateId(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      dateOfBirth: userData.dateOfBirth,
      ssn: userData.ssn, // In production, this should be encrypted
      address: userData.address,
      city: userData.city,
      state: userData.state,
      zipCode: userData.zipCode,
      password: hashedPassword,
      pin: userData.pin, // In production, this should be hashed
      licenseNumber: userData.licenseNumber,
      licenseState: userData.licenseState,
      licenseUrl: userData.licenseUrl,
      accountNumber: userData.accountNumber || generateAccountNumber(),
      checkingBalance: userData.checkingBalance || 0.0,
      savingsBalance: userData.savingsBalance || 0.0,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };

    users.push(newUser);
    await writeUsers(users);

    // Return user without sensitive data
    const { password, ssn, pin, ...safeUser } = newUser;
    
    return NextResponse.json({
      success: true,
      user: safeUser
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// GET - Get user by ID or email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    const users = await readUsers();
    const user = users.find((u: any) => u.id === userId || u.email === email);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user without sensitive data
    const { password, ssn, pin, ...safeUser } = user;
    
    return NextResponse.json({
      success: true,
      user: safeUser
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

// GET - Get all users for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const verification = searchParams.get('verification');

    const users = await readUsers();

    // If requesting specific user by ID
    if (userId) {
      const user = users.find((u: any) => u.id === userId);
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      // Return full user data for admin (including sensitive fields)
      return NextResponse.json({
        success: true,
        user: user
      });
    }

    // Return all users with admin-level data (but still mask highly sensitive info)
    let filteredUsers = users.map((user: any) => {
      const { password, ...adminSafeUser } = user;
      return {
        ...adminSafeUser,
        // Ensure required fields exist with defaults
        accountStatus: user.accountStatus || 'pending',
        verificationStatus: user.verificationStatus || 'pending',
        kycCompleted: user.kycCompleted || false,
        loginAttempts: user.loginAttempts || 0,
        availableCheckingBalance: user.availableCheckingBalance ?? user.checkingBalance,
        availableSavingsBalance: user.availableSavingsBalance ?? user.savingsBalance,
        occupation: user.occupation || '',
        monthlyIncome: user.monthlyIncome || 0
      };
    });

    // Apply filters if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredUsers = filteredUsers.filter((user: any) =>
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.accountNumber?.includes(searchTerm)
      );
    }

    if (status && status !== 'all') {
      filteredUsers = filteredUsers.filter((user: any) => user.accountStatus === status);
    }

    if (verification && verification !== 'all') {
      filteredUsers = filteredUsers.filter((user: any) => user.verificationStatus === verification);
    }

    return NextResponse.json({
      success: true,
      users: filteredUsers
    });

  } catch (error) {
    console.error('Error fetching users for admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PUT - Update user (admin only)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updateData = await request.json();
    const users = await readUsers();
    
    const userIndex = users.findIndex((u: any) => u.id === userId);
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user data
    users[userIndex] = { ...users[userIndex], ...updateData };
    await writeUsers(users);

    // Return updated user without password
    const { password, ...safeUser } = users[userIndex];
    
    return NextResponse.json({
      success: true,
      user: safeUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
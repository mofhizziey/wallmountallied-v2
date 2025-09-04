// app/api/admin/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const ADMINS_FILE = path.join(process.cwd(), 'data', 'admins.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(ADMINS_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read admins from JSON file
async function readAdmins() {
  try {
    await ensureDataDirectory();
    const data = await fs.readFile(ADMINS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create default admin
    const defaultAdmin = {
      id: 'admin-1',
      username: 'admin',
      password: await bcrypt.hash('admin123', 12),
      role: 'super_admin',
      createdAt: new Date().toISOString(),
      lastLogin: null,
      isActive: true
    };
    
    await writeAdmins([defaultAdmin]);
    return [defaultAdmin];
  }
}

// Write admins to JSON file
async function writeAdmins(admins: any[]) {
  await ensureDataDirectory();
  await fs.writeFile(ADMINS_FILE, JSON.stringify(admins, null, 2));
}

// POST - Authenticate admin
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const admins = await readAdmins();
    const admin = admins.find((a: any) => a.username === username);

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { success: false, error: 'Admin account is deactivated' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    const adminIndex = admins.findIndex((a: any) => a.id === admin.id);
    admins[adminIndex].lastLogin = new Date().toISOString();
    await writeAdmins(admins);

    // Return admin without password
    const { password: _, ...safeAdmin } = admins[adminIndex];

    return NextResponse.json({
      success: true,
      admin: safeAdmin
    });

  } catch (error) {
    console.error('Error during admin authentication:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// GET - Get admin by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('id');

    if (!adminId) {
      return NextResponse.json(
        { success: false, error: 'Admin ID is required' },
        { status: 400 }
      );
    }

    const admins = await readAdmins();
    const admin = admins.find((a: any) => a.id === adminId);

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Return admin without password
    const { password, ...safeAdmin } = admin;

    return NextResponse.json({
      success: true,
      admin: safeAdmin
    });

  } catch (error) {
    console.error('Error fetching admin:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin' },
      { status: 500 }
    );
  }
}
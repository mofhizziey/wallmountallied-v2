import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

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

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !admin) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Update last login
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    // Return admin data without password
    const safeAdmin = {
      id: admin.id,
      username: admin.username,
      firstName: admin.first_name,
      lastName: admin.last_name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.created_at,
      lastLogin: new Date().toISOString(),
      isActive: admin.is_active
    };

    return NextResponse.json({
      success: true,
      admin: safeAdmin
    });

  } catch (error) {
    console.error('Error authenticating admin:', error);
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

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('id', adminId)
      .maybeSingle();

    if (error || !admin) {
      return NextResponse.json(
        { success: false, error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Return admin data without password
    const safeAdmin = {
      id: admin.id,
      username: admin.username,
      firstName: admin.first_name,
      lastName: admin.last_name,
      email: admin.email,
      role: admin.role,
      createdAt: admin.created_at,
      lastLogin: admin.last_login,
      isActive: admin.is_active
    };

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
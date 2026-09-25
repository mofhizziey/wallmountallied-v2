import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: 'Account is suspended. Please contact support.' },
        { status: 403 }
      );
    }

    // Validate PIN (In a real app, PINs should be hashed)
    if (user.pin !== pin) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    // Map back to camelCase and remove sensitive data
    const safeUser = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.date_of_birth,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zip_code,
      licenseNumber: user.license_number,
      licenseState: user.license_state,
      licenseUrl: user.license_url,
      accountNumber: user.account_number,
      checkingBalance: user.checking_balance,
      savingsBalance: user.savings_balance,
      createdAt: user.created_at,
      lastLogin: new Date().toISOString(),
      isActive: user.is_active,
      accountStatus: user.account_status,
      verificationStatus: user.verification_status,
    };
    
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
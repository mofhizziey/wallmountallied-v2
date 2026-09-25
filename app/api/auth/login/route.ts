import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

// POST - Authenticate user credentials
export async function POST(request: NextRequest) {
  try {
    const { email, password, step = 'credentials' } = await request.json();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
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

      // Map back to camelCase and remove sensitive data for PIN step
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
        lastLogin: user.last_login,
        isActive: user.is_active,
        accountStatus: user.account_status,
        verificationStatus: user.verification_status,
      };
      
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
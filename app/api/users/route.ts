import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabase';

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

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', userData.email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const accountNum = userData.accountNumber || generateAccountNumber();
    const newId = generateId();
    
    // Create new user in Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        {
          id: newId,
          first_name: userData.firstName,
          last_name: userData.lastName,
          email: userData.email,
          phone: userData.phone,
          date_of_birth: userData.dateOfBirth,
          ssn: userData.ssn,
          address: userData.address,
          city: userData.city,
          state: userData.state,
          zip_code: userData.zipCode,
          password: hashedPassword,
          pin: userData.pin,
          license_number: userData.licenseNumber,
          license_state: userData.licenseState,
          license_url: userData.licenseUrl,
          account_number: accountNum,
          checking_balance: userData.checkingBalance || 0.0,
          savings_balance: userData.savingsBalance || 0.0,
          available_checking_balance: userData.checkingBalance || 0.0,
          available_savings_balance: userData.savingsBalance || 0.0,
          is_active: true,
          account_status: 'pending',
          verification_status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error inserting user:', error);
      throw new Error(error.message);
    }

    // Map back to camelCase for the frontend
    const mappedUser = {
      id: newUser.id,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      email: newUser.email,
      phone: newUser.phone,
      dateOfBirth: newUser.date_of_birth,
      address: newUser.address,
      city: newUser.city,
      state: newUser.state,
      zipCode: newUser.zip_code,
      licenseNumber: newUser.license_number,
      licenseState: newUser.license_state,
      licenseUrl: newUser.license_url,
      accountNumber: newUser.account_number,
      checkingBalance: newUser.checking_balance,
      savingsBalance: newUser.savings_balance,
      createdAt: newUser.created_at,
      lastLogin: newUser.last_login,
      isActive: newUser.is_active,
      accountStatus: newUser.account_status,
      verificationStatus: newUser.verification_status,
    };

    return NextResponse.json({
      success: true,
      user: mappedUser
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

    let query = supabase.from('users').select('*');
    if (userId) {
      query = query.eq('id', userId);
    } else if (email) {
      query = query.eq('email', email);
    }

    const { data: user, error } = await query.maybeSingle();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Map back to camelCase
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
      kycCompleted: user.kyc_completed,
      occupation: user.occupation,
      monthlyIncome: user.monthly_income,
      idFrontUrl: user.id_front_url,
      idBackUrl: user.id_back_url,
      selfieUrl: user.selfie_url,
      availableCheckingBalance: user.available_checking_balance,
      availableSavingsBalance: user.available_savings_balance,
    };
    
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
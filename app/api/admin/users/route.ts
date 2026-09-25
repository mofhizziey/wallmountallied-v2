import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Map Supabase to camelCase
const mapUser = (user: any) => ({
  id: user.id,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  phone: user.phone,
  dateOfBirth: user.date_of_birth,
  ssn: user.ssn,
  address: user.address,
  city: user.city,
  state: user.state,
  zipCode: user.zip_code,
  pin: user.pin,
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
  loginAttempts: user.login_attempts,
  lockReason: user.lock_reason,
  suspensionReason: user.suspension_reason,
  occupation: user.occupation,
  monthlyIncome: user.monthly_income,
  idFrontUrl: user.id_front_url,
  idBackUrl: user.id_back_url,
  selfieUrl: user.selfie_url,
  availableCheckingBalance: user.available_checking_balance,
  availableSavingsBalance: user.available_savings_balance,
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const verification = searchParams.get('verification');

    let query = supabase.from('users').select('*');

    if (userId) {
      query = query.eq('id', userId);
      const { data: user, error } = await query.maybeSingle();
      
      if (error || !user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, user: mapUser(user) });
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,account_number.ilike.%${search}%`);
    }

    if (status && status !== 'all') {
      query = query.eq('account_status', status);
    }

    if (verification && verification !== 'all') {
      query = query.eq('verification_status', verification);
    }

    const { data: users, error } = await query;

    if (error) throw new Error(error.message);

    const safeUsers = (users || []).map(u => {
      const user = mapUser(u);
      return user;
    });

    return NextResponse.json({
      success: true,
      users: safeUsers
    });

  } catch (error) {
    console.error('Error fetching users for admin:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const updateData = await request.json();
    const sbUpdate: any = {};
    
    // Map camelCase to snake_case for updates
    if (updateData.firstName !== undefined) sbUpdate.first_name = updateData.firstName;
    if (updateData.lastName !== undefined) sbUpdate.last_name = updateData.lastName;
    if (updateData.email !== undefined) sbUpdate.email = updateData.email;
    if (updateData.phone !== undefined) sbUpdate.phone = updateData.phone;
    if (updateData.accountStatus !== undefined) sbUpdate.account_status = updateData.accountStatus;
    if (updateData.verificationStatus !== undefined) sbUpdate.verification_status = updateData.verificationStatus;
    if (updateData.isActive !== undefined) sbUpdate.is_active = updateData.isActive;
    if (updateData.kycCompleted !== undefined) sbUpdate.kyc_completed = updateData.kycCompleted;
    if (updateData.checkingBalance !== undefined) sbUpdate.checking_balance = updateData.checkingBalance;
    if (updateData.savingsBalance !== undefined) sbUpdate.savings_balance = updateData.savingsBalance;
    if (updateData.availableCheckingBalance !== undefined) sbUpdate.available_checking_balance = updateData.availableCheckingBalance;
    if (updateData.availableSavingsBalance !== undefined) sbUpdate.available_savings_balance = updateData.availableSavingsBalance;
    if (updateData.lockReason !== undefined) sbUpdate.lock_reason = updateData.lockReason;
    if (updateData.suspensionReason !== undefined) sbUpdate.suspension_reason = updateData.suspensionReason;
    
    const keyMap: Record<string, string> = {
      dateOfBirth: 'date_of_birth', ssn: 'ssn', address: 'address', city: 'city', state: 'state', zipCode: 'zip_code', pin: 'pin', licenseNumber: 'license_number', licenseState: 'license_state', licenseUrl: 'license_url', accountNumber: 'account_number', loginAttempts: 'login_attempts', occupation: 'occupation', monthlyIncome: 'monthly_income', idFrontUrl: 'id_front_url', idBackUrl: 'id_back_url', selfieUrl: 'selfie_url'
    };
    
    for (const [camel, snake] of Object.entries(keyMap)) {
      if (updateData[camel] !== undefined) {
        sbUpdate[snake] = updateData[camel];
      }
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(sbUpdate)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (error || !updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: mapUser(updatedUser)
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'Failed to update user' }, { status: 500 });
  }
}
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

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      user: mapUser(user)
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const updateData = await request.json();
    
    const sbUpdate: any = {};
    const keyMap: Record<string, string> = {
      firstName: 'first_name', lastName: 'last_name', email: 'email', phone: 'phone', dateOfBirth: 'date_of_birth', ssn: 'ssn', address: 'address', city: 'city', state: 'state', zipCode: 'zip_code', pin: 'pin', licenseNumber: 'license_number', licenseState: 'license_state', licenseUrl: 'license_url', accountNumber: 'account_number', checkingBalance: 'checking_balance', savingsBalance: 'savings_balance', isActive: 'is_active', accountStatus: 'account_status', verificationStatus: 'verification_status', kycCompleted: 'kyc_completed', loginAttempts: 'login_attempts', lockReason: 'lock_reason', suspensionReason: 'suspension_reason', occupation: 'occupation', monthlyIncome: 'monthly_income', idFrontUrl: 'id_front_url', idBackUrl: 'id_back_url', selfieUrl: 'selfie_url', availableCheckingBalance: 'available_checking_balance', availableSavingsBalance: 'available_savings_balance'
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
      return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      user: mapUser(updatedUser)
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    
    const { data: deletedUser, error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)
      .select()
      .maybeSingle();
    
    if (error || !deletedUser) {
      return NextResponse.json({ error: 'User not found or delete failed' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser: mapUser(deletedUser)
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
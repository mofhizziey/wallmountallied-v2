const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Starting migration to Supabase...');

  // 1. Migrate Users
  const usersFile = path.join(process.cwd(), 'data', 'users.json');
  if (fs.existsSync(usersFile)) {
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    console.log(`Found ${users.length} users to migrate.`);
    
    for (const user of users) {
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          phone: user.phone,
          date_of_birth: user.dateOfBirth,
          ssn: user.ssn,
          address: user.address,
          city: user.city,
          state: user.state,
          zip_code: user.zipCode,
          password: user.password,
          pin: user.pin,
          license_number: user.licenseNumber,
          license_state: user.licenseState,
          license_url: user.licenseUrl,
          account_number: user.accountNumber,
          checking_balance: user.checkingBalance,
          savings_balance: user.savingsBalance,
          available_checking_balance: user.availableCheckingBalance,
          available_savings_balance: user.availableSavingsBalance,
          created_at: user.createdAt,
          last_login: user.lastLogin,
          is_active: user.isActive,
          account_status: user.accountStatus,
          verification_status: user.verificationStatus,
          kyc_completed: user.kycCompleted,
          login_attempts: user.loginAttempts,
          lock_reason: user.lockReason,
          suspension_reason: user.suspensionReason,
          occupation: user.occupation,
          monthly_income: user.monthlyIncome,
          id_front_url: user.idFrontUrl,
          id_back_url: user.idBackUrl,
          selfie_url: user.selfieUrl
        });

      if (error) {
        console.error(`Error migrating user ${user.email}:`, error);
      } else {
        console.log(`Migrated user: ${user.email}`);
      }
    }
  }

  // 2. Migrate Transactions
  const txFile = path.join(process.cwd(), 'data', 'transactions.json');
  if (fs.existsSync(txFile)) {
    const transactions = JSON.parse(fs.readFileSync(txFile, 'utf8'));
    console.log(`Found ${transactions.length} transactions to migrate.`);
    
    for (const tx of transactions) {
      const { data, error } = await supabase
        .from('transactions')
        .upsert({
          id: tx.id,
          user_id: tx.userId,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          date: tx.date,
          category: tx.category,
          status: tx.status,
          from_account: tx.fromAccount,
          to_account: tx.toAccount,
          created_by: tx.createdBy,
          updated_at: tx.updatedAt,
          updated_by: tx.updatedBy
        });

      if (error) {
        console.error(`Error migrating transaction ${tx.id}:`, error);
      } else {
        console.log(`Migrated transaction: ${tx.id}`);
      }
    }
  }

  // 3. Migrate Admins
  const adminsFile = path.join(process.cwd(), 'data', 'admins.json');
  if (fs.existsSync(adminsFile)) {
    const admins = JSON.parse(fs.readFileSync(adminsFile, 'utf8'));
    console.log(`Found ${admins.length} admins to migrate.`);
    
    for (const admin of admins) {
      const { data, error } = await supabase
        .from('admins')
        .upsert({
          id: admin.id,
          username: admin.username,
          password: admin.password,
          first_name: admin.firstName,
          last_name: admin.lastName,
          email: admin.email,
          role: admin.role,
          created_at: admin.createdAt,
          last_login: admin.lastLogin,
          is_active: admin.isActive
        });

      if (error) {
        console.error(`Error migrating admin ${admin.username}:`, error);
      } else {
        console.log(`Migrated admin: ${admin.username}`);
      }
    }
  }
  
  // 4. Migrate Bank Data (used by admin routes apparently)
  const bankDataFile = path.join(process.cwd(), 'data', 'bank-data.json');
  if (fs.existsSync(bankDataFile)) {
    const bankData = JSON.parse(fs.readFileSync(bankDataFile, 'utf8'));
    console.log('Migrating bank-data.json...');
    
    if (bankData.users) {
      for (const user of bankData.users) {
        await supabase.from('users').upsert({
          id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          email: user.email,
          phone: user.phone,
          date_of_birth: user.dateOfBirth,
          ssn: user.ssn,
          address: user.address,
          city: user.city,
          state: user.state,
          zip_code: user.zipCode,
          password: user.password,
          pin: user.pin,
          license_number: user.licenseNumber,
          license_state: user.licenseState,
          license_url: user.licenseUrl,
          account_number: user.accountNumber,
          checking_balance: user.checkingBalance,
          savings_balance: user.savingsBalance,
          created_at: user.createdAt,
          last_login: user.lastLogin,
          is_active: user.isActive,
          account_status: user.accountStatus
        });
      }
    }
    
    if (bankData.transactions) {
      for (const tx of bankData.transactions) {
        await supabase.from('transactions').upsert({
          id: tx.id,
          user_id: tx.userId,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          date: tx.date,
          category: tx.category,
          status: tx.status
        });
      }
    }
    
    if (bankData.admins) {
      for (const admin of bankData.admins) {
        await supabase.from('admins').upsert({
          id: admin.id,
          username: admin.username,
          password: admin.password,
          first_name: admin.firstName,
          last_name: admin.lastName,
          email: admin.email,
          role: admin.role,
          created_at: admin.createdAt,
          is_active: admin.isActive
        });
      }
    }
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);

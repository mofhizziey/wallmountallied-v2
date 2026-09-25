import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - Get debug statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      const [{ data: users, error: usersErr }, { data: admins, error: adminsErr }, { count: txCount }] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('admins').select('*'),
        supabase.from('transactions').select('*', { count: 'exact', head: true })
      ]);
      
      if (usersErr) throw new Error(usersErr.message);

      const safeUsers = users || [];

      // Calculate stats
      const stats = {
        version: '1.0.0 (Supabase)',
        totalUsers: safeUsers.length,
        totalTransactions: txCount || 0,
        totalAdmins: (admins || []).length,
        storageSize: 'N/A (Managed by Supabase)',
        lastUpdated: new Date().toISOString(),
        activeUsers: safeUsers.filter((user: any) => user.is_active).length,
        inactiveUsers: safeUsers.filter((user: any) => !user.is_active).length
      };

      return NextResponse.json({ success: true, stats });

    } else if (action === 'export') {
      const { data: users, error } = await supabase.from('users').select('*');
      if (error) throw new Error(error.message);
      
      // Remove sensitive data for export
      const exportData = (users || []).map((user: any) => {
        const { password, ssn, pin, ...safeUser } = user;
        return safeUser;
      });

      return NextResponse.json({ 
        success: true, 
        data: {
          exportDate: new Date().toISOString(),
          version: '1.0.0 (Supabase)',
          users: exportData
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in debug API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process debug request' },
      { status: 500 }
    );
  }
}

// DELETE - Clear all data
export async function DELETE(request: NextRequest) {
  try {
    // Only allow in development or with special header
    const isDev = process.env.NODE_ENV === 'development';
    const hasDebugHeader = request.headers.get('x-debug-mode') === 'true';
    
    if (!isDev && !hasDebugHeader) {
      return NextResponse.json(
        { success: false, error: 'Debug operations not allowed in production' },
        { status: 403 }
      );
    }

    // In a real database, you might not want to let the debug route drop everything, 
    // but for parity with the old fs behavior:
    await Promise.all([
      supabase.from('users').delete().neq('id', '0'), // delete all
      supabase.from('transactions').delete().neq('id', '0'),
      supabase.from('bills').delete().neq('id', '0')
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'All data cleared successfully' 
    });

  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}
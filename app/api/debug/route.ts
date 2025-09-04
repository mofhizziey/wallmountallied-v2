// app/api/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');

// Read users from JSON file
async function readUsers() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write users to JSON file
async function writeUsers(users: any[]) {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(users, null, 2));
}

// GET - Get debug statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'stats') {
      const users = await readUsers();
      
      // Calculate storage size
      let storageSize = 0;
      try {
        const stats = await fs.stat(DATA_FILE);
        storageSize = stats.size;
      } catch {
        storageSize = 0;
      }

      // Calculate stats
      const stats = {
        version: '1.0.0',
        totalUsers: users.length,
        totalTransactions: users.reduce((total: number, user: any) => {
          // You can add transaction counting logic here if you have transactions
          return total + (user.transactions?.length || 0);
        }, 0),
        totalAdmins: users.filter((user: any) => user.isAdmin).length,
        storageSize,
        lastUpdated: new Date().toISOString(),
        activeUsers: users.filter((user: any) => user.isActive).length,
        inactiveUsers: users.filter((user: any) => !user.isActive).length
      };

      return NextResponse.json({ success: true, stats });

    } else if (action === 'export') {
      const users = await readUsers();
      
      // Remove sensitive data for export
      const exportData = users.map((user: any) => {
        const { password, ssn, pin, ...safeUser } = user;
        return safeUser;
      });

      return NextResponse.json({ 
        success: true, 
        data: {
          exportDate: new Date().toISOString(),
          version: '1.0.0',
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

    // Clear the users file
    await writeUsers([]);

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
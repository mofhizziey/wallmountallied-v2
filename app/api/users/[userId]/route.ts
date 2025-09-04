// app/api/admin/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'bank-data.json')

// Ensure data directory and file exist
async function ensureDataFile() {
  const dir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
  
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ users: [], transactions: [], admins: [] }))
  }
}

// PATCH /api/admin/users/[userId] - Update a specific user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await ensureDataFile()
    
    const { userId } = params
    const updateData = await request.json()
    
    // Read current data
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8')
    const data = JSON.parse(fileContent)
    
    // Find and update the user
    const userIndex = data.users.findIndex((u: any) => u.id === userId)
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Merge the update data with existing user data
    data.users[userIndex] = {
      ...data.users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    // Save updated data back to file
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
    
    return NextResponse.json({
      success: true,
      user: data.users[userIndex]
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[userId] - Delete a user (optional)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await ensureDataFile()
    
    const { userId } = params
    
    // Read current data
    const fileContent = await fs.readFile(DATA_FILE, 'utf-8')
    const data = JSON.parse(fileContent)
    
    // Find the user
    const userIndex = data.users.findIndex((u: any) => u.id === userId)
    
    if (userIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Remove the user
    const deletedUser = data.users.splice(userIndex, 1)[0]
    
    // Also remove user's transactions
    data.transactions = data.transactions.filter((t: any) => t.userId !== userId)
    
    // Save updated data
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
      deletedUser
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
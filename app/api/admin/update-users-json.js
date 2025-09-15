// Create this file: pages/api/admin/update-users-json.js
// This endpoint will directly update your users.json file

import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const USERS_FILE = path.join(process.cwd(), 'users.json')

export async function POST(request) {
  try {
    const { userId, updateData } = await request.json()
    
    console.log(`[API] Updating users.json for user ${userId}:`, updateData)
    
    // Read current users.json file
    let users = []
    try {
      const fileContent = await fs.readFile(USERS_FILE, 'utf-8')
      users = JSON.parse(fileContent)
    } catch (error) {
      console.error('[API] Error reading users.json:', error)
      return NextResponse.json(
        { error: 'Could not read users.json file' },
        { status: 500 }
      )
    }
    
    // Find the user to update
    const userIndex = users.findIndex(user => user.id === userId)
    
    if (userIndex === -1) {
      console.log(`[API] User ${userId} not found in users.json`)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Update the user with new data
    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    
    // Write the updated users array back to users.json
    try {
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
      console.log(`[API] Successfully updated user ${userId} in users.json`)
    } catch (error) {
      console.error('[API] Error writing to users.json:', error)
      return NextResponse.json(
        { error: 'Could not write to users.json file' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user: users[userIndex],
      message: 'User updated in users.json successfully'
    })
    
  } catch (error) {
    console.error('[API] Error in update-users-json:', error)
    return NextResponse.json(
      { error: 'Failed to update users.json' },
      { status: 500 }
    )
  }
}
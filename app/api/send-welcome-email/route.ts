// app/api/send-welcome-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { sendGridEmailService } from '@/lib/email-service-sendgrid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, accountNumber } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !accountNumber) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: firstName, lastName, email, accountNumber' 
        },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email format' 
        },
        { status: 400 }
      )
    }

    console.log('📧 API: Sending welcome emails and admin notification for:', email)

    // Send welcome emails and admin notification
    const emailResult = await sendGridEmailService.handleNewUserRegistration({
      firstName,
      lastName,
      email,
      accountNumber
    })

    console.log('📧 API: Email result:', {
      welcomeEmailSent: emailResult.welcomeEmailSent,
      adminNotificationSent: emailResult.adminNotificationSent,
      errors: emailResult.errors
    })

    // Log specific results for debugging
    if (emailResult.welcomeEmailSent) {
      console.log('✅ Welcome email sent successfully to:', email)
    } else {
      console.log('❌ Welcome email failed for:', email)
    }

    if (emailResult.adminNotificationSent) {
      console.log('✅ Admin notification sent successfully')
    } else {
      console.log('❌ Admin notification failed')
    }

    if (emailResult.errors.length > 0) {
      console.log('⚠️ Email errors:', emailResult.errors)
    }

    return NextResponse.json({
      success: true,
      welcomeEmailSent: emailResult.welcomeEmailSent,
      adminNotificationSent: emailResult.adminNotificationSent,
      errors: emailResult.errors
    })

  } catch (error) {
    console.error('❌ Email API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send welcome emails',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle other methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
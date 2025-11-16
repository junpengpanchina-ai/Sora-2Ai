import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type IssuePayload = {
  userName?: string
  contactPhone?: string
  contactEmail?: string
  issueCategory?: string
  issueDescription?: string
}

type AfterSalesIssueInsert = Database['public']['Tables']['after_sales_issues']['Insert']

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as IssuePayload
    const { userName, contactPhone, contactEmail, issueCategory, issueDescription } = payload

    if (!userName || !contactPhone || !issueDescription) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: 'userName, contactPhone, and issueDescription are mandatory.',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const newIssue: AfterSalesIssueInsert = {
      user_name: userName.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail?.trim() || null,
      issue_category: issueCategory?.trim() || null,
      issue_description: issueDescription.trim(),
    }

    const insertResult = await supabase
      .from('after_sales_issues')
      // @ts-expect-error Supabase generated types not yet updated for after_sales_issues table
      .insert(newIssue)
      .select('id')
      .single()

    const { data, error } = insertResult as {
      data: { id: string } | null
      error: { message?: string } | null
    }

    if (error || !data) {
      console.error('Failed to store customer feedback:', error)
      return NextResponse.json(
        {
          error: 'Failed to store customer feedback',
          details: error?.message ?? 'Unknown error',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        issueId: data.id,
        message: 'Your feedback has been received. Our team will contact you shortly.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error while storing customer feedback:', error)
    return NextResponse.json(
      {
        error: 'Unexpected error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}


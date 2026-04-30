import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    // Fetch supervisions based on role
    let query = supabase
      .from('supervisions')
      .select(`
        id,
        title,
        description,
        type,
        status,
        academic_year,
        start_date,
        end_date,
        objectives,
        teacher_id,
        student_id,
        theme_id
      `)
      .order('created_at', { ascending: false })

    // Filter by teacher_id if not admin/director
    if (userData?.role !== 'admin' && userData?.role !== 'director') {
      query = query.eq('teacher_id', user.id)
    }

    const { data: supervisions, error } = await query

    if (error) {
      console.error('[v0] Error fetching supervisions for PDF:', error)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // Fetch related data separately if supervisions exist
    let enrichedSupervisions: any[] = []
    if (supervisions && supervisions.length > 0) {
      // Get unique IDs
      const teacherIds = [...new Set(supervisions.map(s => s.teacher_id).filter(Boolean))]
      const studentIds = [...new Set(supervisions.map(s => s.student_id).filter(Boolean))]
      const themeIds = [...new Set(supervisions.map(s => s.theme_id).filter(Boolean))]

      // Fetch teachers
      const { data: teachers } = teacherIds.length > 0 
        ? await supabase.from('users').select('id, full_name, email').in('id', teacherIds)
        : { data: [] }

      // Fetch students
      const { data: students } = studentIds.length > 0
        ? await supabase.from('students').select('id, registration_number, program, level, email').in('id', studentIds)
        : { data: [] }

      // Fetch themes
      const { data: themes } = themeIds.length > 0
        ? await supabase.from('themes').select('id, name').in('id', themeIds)
        : { data: [] }

      // Create lookup maps
      const teacherMap = new Map((teachers || []).map(t => [t.id, t]))
      const studentMap = new Map((students || []).map(s => [s.id, s]))
      const themeMap = new Map((themes || []).map(t => [t.id, t]))

      // Enrich supervisions
      enrichedSupervisions = supervisions.map(sup => ({
        ...sup,
        teacher: teacherMap.get(sup.teacher_id) || null,
        student: studentMap.get(sup.student_id) || null,
        theme: themeMap.get(sup.theme_id) || null,
      }))
    }

    // Generate HTML for PDF
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const typeLabels: Record<string, string> = {
      pfe: 'PFE (Final Year Project)',
      master: 'Master Thesis',
      doctorate: 'Doctorate/PhD',
      internship: 'Internship',
      research: 'Research Project'
    }

    const statusLabels: Record<string, string> = {
      active: 'Active',
      completed: 'Completed',
      on_hold: 'On Hold',
      cancelled: 'Cancelled'
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LMCS Supervision Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 40px;
      max-width: 210mm;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #2563eb;
    }
    .logo-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin-bottom: 15px;
    }
    .logo-placeholder {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 24px;
    }
    h1 {
      color: #1e40af;
      font-size: 28px;
      margin-bottom: 5px;
    }
    .subtitle {
      color: #64748b;
      font-size: 14px;
    }
    .report-info {
      background: #f8fafc;
      padding: 15px 20px;
      border-radius: 8px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
    .info-item {
      font-size: 13px;
    }
    .info-label {
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      color: #1e293b;
      font-weight: 600;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: #f1f5f9;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-value {
      font-size: 28px;
      font-weight: 700;
      color: #1e40af;
    }
    .summary-label {
      font-size: 12px;
      color: #64748b;
      margin-top: 5px;
    }
    .supervision-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .supervision-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e2e8f0;
    }
    .supervision-title {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 5px;
    }
    .supervision-meta {
      font-size: 13px;
      color: #64748b;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge-active {
      background: #dcfce7;
      color: #166534;
    }
    .badge-completed {
      background: #dbeafe;
      color: #1e40af;
    }
    .badge-on_hold {
      background: #fef3c7;
      color: #92400e;
    }
    .badge-cancelled {
      background: #fee2e2;
      color: #991b1b;
    }
    .supervision-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .detail-group {
      margin-bottom: 10px;
    }
    .detail-label {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .detail-value {
      font-size: 14px;
      color: #1e293b;
    }
    .description {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
    }
    .description-text {
      font-size: 14px;
      color: #475569;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #64748b;
    }
    @media print {
      body {
        padding: 20px;
      }
      .supervision-card {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="logo-placeholder">L</div>
      <div>
        <h1>LMCS Laboratory</h1>
        <p class="subtitle">Supervision Management Report</p>
      </div>
    </div>
  </div>

  <div class="report-info">
    <div class="info-item">
      <span class="info-label">Generated on:</span>
      <span class="info-value">${currentDate}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Generated by:</span>
      <span class="info-value">${userData?.full_name || user.email}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Total Records:</span>
      <span class="info-value">${supervisions?.length || 0}</span>
    </div>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="summary-value">${supervisions?.length || 0}</div>
      <div class="summary-label">Total Supervisions</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${supervisions?.filter(s => s.status === 'active').length || 0}</div>
      <div class="summary-label">Active</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${supervisions?.filter(s => s.status === 'completed').length || 0}</div>
      <div class="summary-label">Completed</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${supervisions?.filter(s => s.type === 'doctorate').length || 0}</div>
      <div class="summary-label">PhD Projects</div>
    </div>
  </div>

  ${!enrichedSupervisions || enrichedSupervisions.length === 0 ? `
    <div class="no-data">
      <p>No supervision records found.</p>
    </div>
  ` : enrichedSupervisions.map((sup: any) => `
    <div class="supervision-card">
      <div class="supervision-header">
        <div>
          <div class="supervision-title">${sup.title || 'Untitled'}</div>
          <div class="supervision-meta">${typeLabels[sup.type] || sup.type} | ${sup.academic_year || 'N/A'}</div>
        </div>
        <span class="badge badge-${sup.status}">${statusLabels[sup.status] || sup.status}</span>
      </div>
      <div class="supervision-details">
        <div class="detail-group">
          <div class="detail-label">Supervisor</div>
          <div class="detail-value">${sup.teacher?.full_name || 'N/A'}</div>
        </div>
        <div class="detail-group">
          <div class="detail-label">Student</div>
          <div class="detail-value">${sup.student?.registration_number || 'N/A'}</div>
        </div>
        <div class="detail-group">
          <div class="detail-label">Program</div>
          <div class="detail-value">${sup.student?.program || 'N/A'}</div>
        </div>
        <div class="detail-group">
          <div class="detail-label">Research Theme</div>
          <div class="detail-value">${sup.theme?.name || 'N/A'}</div>
        </div>
        <div class="detail-group">
          <div class="detail-label">Start Date</div>
          <div class="detail-value">${sup.start_date ? new Date(sup.start_date).toLocaleDateString() : 'N/A'}</div>
        </div>
        <div class="detail-group">
          <div class="detail-label">End Date</div>
          <div class="detail-value">${sup.end_date ? new Date(sup.end_date).toLocaleDateString() : 'Ongoing'}</div>
        </div>
      </div>
      ${sup.description ? `
        <div class="description">
          <div class="detail-label">Description</div>
          <p class="description-text">${sup.description}</p>
        </div>
      ` : ''}
    </div>
  `).join('')}

  <div class="footer">
    <p>LMCS Laboratory - Higher National School of Computer Science (ESI), Algiers</p>
    <p>This report was automatically generated. For questions, contact the laboratory administration.</p>
  </div>
</body>
</html>
`

    // Return HTML that can be printed as PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': 'inline; filename="lmcs-supervision-report.html"',
      },
    })
  } catch (error) {
    console.error('[v0] PDF export error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connection } from 'mongoose';
import { BugReportSchema, IBugReport } from '@/app/api/bug-report/route';

let BugReport: mongoose.Model<IBugReport>;
try {
  const bugDb = mongoose.connection.useDb('defacts');
  BugReport = bugDb.models.BugReport || bugDb.model<IBugReport>('bug_reports', BugReportSchema);
} catch (err) {
  throw new Error('Failed to register BugReport model');
}

async function dbConnect(): Promise<void> {
  if (connection.readyState >= 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Mongo URI missing');
  await mongoose.connect(uri)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { bugId: string; index: string } }
) {
  try {
    await dbConnect();

    const { bugId, index } = params;
    const download = new URL(request.url).searchParams.get('download') === 'true';

    const attachmentIndex = parseInt(index, 10);
    if (isNaN(attachmentIndex) || attachmentIndex < 0) {
      return NextResponse.json({ error: 'Invalid attachment index' }, { status: 400 });
    }

    const bugReport = await BugReport.findOne({ bugId }).lean();
    if (!bugReport) {
      return NextResponse.json({ error: 'Bug report not found' }, { status: 404 });
    }

    const attachment = bugReport.attachments?.[attachmentIndex];
    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    return new NextResponse(attachment.data.buffer, {
      status: 200,
      headers: {
        'Content-Type': attachment.contentType,
        'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${attachment.filename}"`,
        'Content-Length': attachment.size.toString(),
      },
    });
  } catch (err) {
    console.error('Error fetching attachment:', err);
    return NextResponse.json({ error: 'Failed to fetch attachment' }, { status: 500 });
  }
}

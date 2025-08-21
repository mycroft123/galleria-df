import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, model, connect, connection, Types, HydratedDocument } from 'mongoose';
import { jwtDecode } from 'jwt-decode';
import { Long } from 'mongodb';

interface JwtPayload {
  id: string;
  sessionId: string;
  iat: Long;
  exp: Long;
}

// 1️⃣ Define TypeScript interfaces
interface IScreenshot {
  filename: string;
  contentType: string;
  size: number;
  data: Buffer;
}

interface IBugReport {
  bugId: string;
  userId: string;
  bugDescription: string;
  attachments: IScreenshot[];
  submittedAt: Date;
}

export interface IUser {
  _id: Types.ObjectId;
  name?: string;
  username?: string;
  email: string;
  emailVerified: boolean;
  password?: string;
  avatar?: string;
  provider: string;
  role?: string;
  googleId?: string;
  facebookId?: string;
  openidId?: string;
  samlId?: string;
  ldapId?: string;
  githubId?: string;
  discordId?: string;
  appleId?: string;
  plugins?: unknown[];
  twoFactorEnabled?: boolean;
  totpSecret?: string;
  backupCodes?: Array<{
    codeHash: string;
    used: boolean;
    usedAt?: Date | null;
  }>;
  refreshToken?: Array<{
    refreshToken: string;
  }>;
  expiresAt?: Date;
  termsAccepted?: boolean;
  personalization?: {
    memories?: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

// 2️⃣ Create Mongoose Schemas with those interfaces
const AttachmentsSchema = new Schema<IScreenshot>({
  filename: String,
  contentType: String,
  size: Number,
  data: Buffer,
});

const BugReportSchema = new Schema<IBugReport>({
  bugId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  bugDescription: { type: String, required: true },
  attachments: [AttachmentsSchema],
  submittedAt: { type: Date, required: true, default: () => new Date() },
});

// 3️⃣ Define Mongoose Models with correct generics
let BugReport: mongoose.Model<IBugReport>;

try {
  const bugDb = mongoose.connection.useDb('defacts');
  BugReport = bugDb.models.BugReport || bugDb.model<IBugReport>('bug_reports', BugReportSchema);
} catch (err) {
  throw new Error('Failed to register BugReport model');
}

const UserSchema = new Schema<IUser>({
  _id: { type: Schema.Types.ObjectId, required: true },
  name: String,
  email: String,
}, { collection: 'users' }); 

const libreDb = mongoose.connection.useDb('LibreChat');
const User = libreDb.models.User || libreDb.model<IUser>('User', UserSchema);

// 4️⃣ Mongoose connection helper
async function dbConnect(): Promise<void> {
  if (connection.readyState >= 1) return;

  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    throw new Error('Please add your Mongo URI to env file');
  }
  await connect(uri, { dbName: 'LibreChat' });
}

// 5️⃣ Bug ID generation logic
async function generateBugId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `BUG-${currentYear}-`;

  const lastBug = await BugReport.findOne({ bugId: { $regex: `^${prefix}` } })
    .sort({ submittedAt: -1 })
    .lean() as IBugReport | null;

  let nextSeq = 1;
  if (lastBug?.bugId) {
    const parts = lastBug.bugId.split('-');
    if (parts.length === 3) {
      const seq = parseInt(parts[2], 10);
      if (!isNaN(seq)) nextSeq = seq + 1;
    }
  }

  const sequenceNumber = nextSeq.toString().padStart(3, '0');
  return `${prefix}${sequenceNumber}`;
}

// 6️⃣ Token extraction helper
function getUserIdFromRefreshToken(request: NextRequest): string | false {
  const refresh = request.cookies.get('refreshToken');
  if (!refresh?.value) return false;
  const decoded = jwtDecode<JwtPayload>(refresh.value);
  return decoded.id;
}

// GET user info helper
async function getUserDetailsByUserId(userId: string): Promise<any> {
  return User.findById(userId).lean();
}

// 7️⃣ POST handler
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const userId = getUserIdFromRefreshToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: No token is provided' }, { status: 401 });
    }

    const formData = await request.formData();
    const bugDescription = formData.get('bugDescription') as string;
    const screenshots = formData.getAll('screenshots') as File[];

    if (!bugDescription || bugDescription.trim().length < 50) {
      return NextResponse.json({ error: 'Bug description must be at least 50 characters' }, { status: 400 });
    }
    if (bugDescription.trim().length > 1000) {
      return NextResponse.json({ error: 'Bug description must be under 1000 characters' }, { status: 400 });
    }

    const processedScreenshots: IScreenshot[] = [];
    for (const s of screenshots) {
      if (s.size > 0) {
        if (s.size > 5 * 1024 * 1024) {
          return NextResponse.json({ error: `Screenshot "${s.name}" too large (max 5MB)` }, { status: 400 });
        }
        const bytes = await s.arrayBuffer();
        processedScreenshots.push({
          filename: s.name,
          contentType: s.type,
          size: s.size,
          data: Buffer.from(bytes),
        });
      }
    }

    const bugId = await generateBugId();

    const newBug = new BugReport({
      bugId,
      userId,
      bugDescription: bugDescription.trim(),
      attachments: processedScreenshots,
      submittedAt: new Date(),
    });

    const saved = await newBug.save();

    return NextResponse.json({
      success: true,
      message: 'Bug report submitted successfully',
      bugId,
      reportId: saved._id,
    });
  } catch (err) {
    console.error('Error submitting bug report:', err);
    return NextResponse.json({ error: 'Failed to submit bug report' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const userId = getUserIdFromRefreshToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: No token is provided' }, { status: 401 });
    }

    const user = await getUserDetailsByUserId(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    if (page <= 0 || limit <= 0) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const skip = (page - 1) * limit;
    const bugId = searchParams.get('bugId');
    const bugDescription = searchParams.get('bugDescription');
    const name = searchParams.get('name');
    const email = searchParams.get('email');

    const bugReportFilter: any = {};
    if (bugId) {
      bugReportFilter.bugId = { $regex: bugId, $options: 'i' };
    }
    if (bugDescription) {
      bugReportFilter.bugDescription = { $regex: bugDescription, $options: 'i' };
    }

    if (name || email) {
      const userFilter: any = {};
      if (name) userFilter.name = { $regex: name, $options: 'i' };
      if (email) userFilter.email = { $regex: email, $options: 'i' };

      const matchingUsers = await User.find(userFilter).select('_id').lean();
      const matchingUserIds = matchingUsers.map((u) => u._id.toString());

      // ⛔ If no users matched, short-circuit early
      if (matchingUserIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
            page,
            limit,
            totalPages: 0,
          },
        });
      }

      bugReportFilter.userId = { $in: matchingUserIds };
    }

    const total = await BugReport.countDocuments(bugReportFilter);
    const rawReports = await BugReport.find(bugReportFilter)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec();

    const bugReports: IBugReport[] = rawReports.map((report) => ({
      bugId: report.bugId,
      userId: report.userId,
      bugDescription: report.bugDescription,
      attachments: report.attachments?.map((attachment) => ({
        filename: attachment.filename,
        contentType: attachment.contentType,
        size: attachment.size,
        data: Buffer.from(attachment.data as any),
      })) || [],
      submittedAt: report.submittedAt,
    }));

    const enriched = await Promise.all(
      bugReports.map(async (report) => {
        const reporter = await getUserDetailsByUserId(report.userId);
        return {
          ...report,
          ...(reporter ? { name: reporter.name, email: reporter.email } : {}),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: enriched,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Error fetching bug reports:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve bug reports' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, Binary, Long } from 'mongodb';
import { jwtDecode } from 'jwt-decode'

interface jwtPayload {
  id: string
  sessionId: string
  iat: Long
  exp: Long
}

// MongoDB connection function
async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    throw new Error('Please add your Mongo URI to env file');
  }

  const client = new MongoClient(uri);
  await client.connect();
  return client;
}

// Function to generate sequential bug ID
async function generateBugId(db: any): Promise<string> {
  const currentYear = new Date().getFullYear();

  // Find the latest inserted bug report where bugId is a string (any year)
  const lastBug = await db.collection('bug_reports').findOne(
    { bugId: { $type: "string" } },
    { sort: { _id: -1 } }
  );

  let nextSequence = 1;

  if (lastBug && lastBug.bugId) {
    const lastBugId = lastBug.bugId; // e.g., "bug-2025-000123"
    const parts = lastBugId.split('-');

    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2], 10);
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1;
      }
    }
  }

  const sequenceNumber = nextSequence.toString().padStart(3, '0');
  return `BUG-${currentYear}-${sequenceNumber}`;
}

export async function POST(request: NextRequest) {
  let client;

  try {
    // Extract userId from the request
    const refreshTokenCookie = request.cookies.get('refreshToken');
    if (!refreshTokenCookie?.value) {
      return NextResponse.json(
        { error: 'Unauthorized: No token is provided' },
        { status: 401 }
      );
    }
    const userId = jwtDecode<jwtPayload>(refreshTokenCookie.value).id;

    const formData = await request.formData();
    const bugDescription = formData.get('bugDescription') as string;
    const screenshots = formData.getAll('screenshots') as File[];

    if (!bugDescription || bugDescription.trim().length < 50) {
      return NextResponse.json(
        { error: 'Bug description must be at least 50 characters long' },
        { status: 400 }
      );
    }

    if (bugDescription.trim().length > 1000) {
      return NextResponse.json(
        { error: 'Bug description must be under 1000 characters' },
        { status: 400 }
      );
    }

    const processedScreenshots = [];
    for (const screenshot of screenshots) {
      if (screenshot.size > 0) {
        if (screenshot.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: `Screenshot "${screenshot.name}" is too large. Maximum size is 5MB.` },
            { status: 400 }
          );
        }

        const bytes = await screenshot.arrayBuffer();
        const binaryData = new Binary(new Uint8Array(bytes));

        processedScreenshots.push({
          filename: screenshot.name,
          contentType: screenshot.type,
          size: screenshot.size,
          data: binaryData
        });
      }
    }

    // Connect to database first to generate bug ID
    client = await connectToDatabase();
    const db = client.db('defacts');

    // Generate sequential bug ID
    const bugId = await generateBugId(db);

    const bugReport = {
      bugId: bugId,
      userId,
      bugDescription: bugDescription.trim(),
      screenshots: processedScreenshots,
      submittedAt: new Date(),
    };

    const result = await db.collection('bug_reports').insertOne(bugReport);

    return NextResponse.json({
      success: true,
      message: 'Bug report submitted successfully',
      bugId: bugId,
      reportId: result.insertedId
    });

  } catch (error) {
    console.error('Error submitting bug report:', error);
    return NextResponse.json(
      { error: 'Failed to submit bug report' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
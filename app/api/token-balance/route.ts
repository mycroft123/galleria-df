// app/api/token-balance/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb'; // You'll need to create this if you don't have it
import { getServerSession } from 'next-auth/next'; // Or your auth method

export async function GET() {
  // Get current user from session
  const session = await getServerSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Find user and balance
    const user = await db.collection('users').findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const balance = await db.collection('balances').findOne({ user: user._id });
    
    // Return the balance
    return NextResponse.json({ 
      balance: balance ? balance.tokenCredits : 0 
    });
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return NextResponse.json({ error: 'Failed to fetch token balance' }, { status: 500 });
  }
}
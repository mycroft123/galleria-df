// app/api/token-balance/route.ts
import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// MongoDB connection function
async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    throw new Error('Please add your Mongo URI to .env.local');
  }
  
  const client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function GET() {
  let client;
  
  try {
    client = await connectToDatabase();
    const db = client.db('test'); // Explicitly use the 'test' database
    
    // Since we don't have auth integration yet, get the first user
    // This is a temporary solution until auth is implemented
    const users = await db.collection('users').find({}).limit(2).toArray();
    
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }
    
    // Get balances for both users
    const balances = await db.collection('balances').find({
      user: { $in: users.map(user => user._id) }
    }).toArray();
    
    // Return the balances for all users
    return NextResponse.json({ 
      balances: balances.map(balance => ({
        userId: balance.user.toString(),
        email: users.find(user => user._id.toString() === balance.user.toString())?.email,
        tokenCredits: balance.tokenCredits
      })),
      // For the component, return the first user's balance
      balance: balances.length > 0 ? balances[0].tokenCredits : 0
    });
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return NextResponse.json({ error: 'Failed to fetch token balances' }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
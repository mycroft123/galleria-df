// // lib/mongodb.ts
// import { MongoClient } from 'mongodb';

// const uri = process.env.MONGODB_URI || '';
// const options = {
//   useUnifiedTopology: true,
//   useNewUrlParser: true,
// };

// let client;
// let clientPromise;

// if (!uri) {
//   throw new Error('Please add your Mongo URI to .env.local');
// }

// // In development mode, use a global variable to preserve connection across reloads
// if (process.env.NODE_ENV === 'development') {
//   if (!global._mongoClientPromise) {
//     client = new MongoClient(uri, options);
//     global._mongoClientPromise = client.connect();
//   }
//   clientPromise = global._mongoClientPromise;
// } else {
//   // In production mode, create a new client for each connection
//   client = new MongoClient(uri, options);
//   clientPromise = client.connect();
// }

// export async function connectToDatabase() {
//   const client = await clientPromise;
//   const db = client.db(); // If you have a specific DB name, use client.db('your-db-name')
  
//   return { client, db };
// }

import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

const uri: string = MONGODB_URI;

declare global {
  var mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}

if (!global.mongoose) {
  global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<Mongoose> {
  if (global.mongoose.conn) return global.mongoose.conn;

  if (!global.mongoose.promise) {
    global.mongoose.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  global.mongoose.conn = await global.mongoose.promise;
  return global.mongoose.conn;
}

export default dbConnect;

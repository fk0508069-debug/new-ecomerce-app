import mongoose from "mongoose";
import dns from "dns";

const dnsServers = process.env.MONGODB_DNS_SERVERS
  ?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);

dns.setServers(dnsServers?.length ? dnsServers : ["8.8.8.8", "1.1.1.1"]);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("Please define the MONGODB_URI environment variable");
    }

    const opts = {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB || "NovaStore",
      family: 4,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    };
    cached.promise = mongoose.connect(uri, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
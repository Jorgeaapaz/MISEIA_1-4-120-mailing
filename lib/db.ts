import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI!
const dbName = process.env.MONGODB_DB!

if (!uri) throw new Error('Missing MONGODB_URI env variable')
if (!dbName) throw new Error('Missing MONGODB_DB env variable')

let client: MongoClient
let db: Db

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri)
  }
  client = global._mongoClient
} else {
  client = new MongoClient(uri)
}

export async function getDb(): Promise<Db> {
  if (!db) {
    await client.connect()
    db = client.db(dbName)
  }
  return db
}

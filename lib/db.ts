import { MongoClient, Db } from 'mongodb'

declare global {
  // eslint-disable-next-line no-var
  var _mongoClient: MongoClient | undefined
}

let _client: MongoClient | null = null
let _db: Db | null = null

export async function getDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB
  if (!uri) throw new Error('Missing MONGODB_URI env variable')
  if (!dbName) throw new Error('Missing MONGODB_DB env variable')

  if (_db) return _db

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClient) {
      global._mongoClient = new MongoClient(uri)
    }
    _client = global._mongoClient
  } else {
    if (!_client) {
      _client = new MongoClient(uri)
    }
  }

  await _client.connect()
  _db = _client.db(dbName)
  return _db
}

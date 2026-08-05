const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Uses the mongod already installed via Homebrew instead of letting
// mongodb-memory-server download its own binary - faster and works offline.
async function connectTestDb() {
  mongod = await MongoMemoryServer.create({
    binary: { systemBinary: '/opt/homebrew/bin/mongod', version: '8.3.7' },
  });
  await mongoose.connect(mongod.getUri());
}

async function disconnectTestDb() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

async function clearTestDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

module.exports = { connectTestDb, disconnectTestDb, clearTestDb };

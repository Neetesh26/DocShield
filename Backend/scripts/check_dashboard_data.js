import mongoose from 'mongoose';

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/docushield');
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  console.log('Seeded Users in DB:');
  users.forEach(u => console.log(`- ${u.name} (${u.role}) [${u.email}] Dept: ${u.department}`));
  await mongoose.disconnect();
}

main().catch(console.error);

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/docushield';

async function sync() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const locs = await mongoose.connection.db.collection('storagelocations').find({}).toArray();
  for (const l of locs) {
    const count = await mongoose.connection.db.collection('documents').countDocuments({ storageLocation: l._id });
    console.log(`Location ${l.code}: was ${l.currentOccupancy}, updating to ${count}`);
    await mongoose.connection.db.collection('storagelocations').updateOne(
      { _id: l._id },
      { $set: { currentOccupancy: count } }
    );
  }

  console.log('Sync complete!');
  await mongoose.disconnect();
}

sync().catch(err => {
  console.error(err);
  process.exit(1);
});


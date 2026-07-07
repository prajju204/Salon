require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to DB.');
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (let col of collections) {
    console.log(`Indexes for ${col.name}:`);
    const indexes = await db.collection(col.name).indexes();
    console.log(JSON.stringify(indexes, null, 2));
  }
  mongoose.connection.close();
}).catch(err => {
  console.error(err);
});

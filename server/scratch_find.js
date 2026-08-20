require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Successfully connected to MongoDB Atlas.');
  
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  console.log('Searching for email: prajwaldp03@gmail.com across all collections...');
  for (let colInfo of collections) {
    const colName = colInfo.name;
    const count = await db.collection(colName).countDocuments({ email: 'prajwaldp03@gmail.com' });
    if (count > 0) {
      console.log(`Found in collection "${colName}": ${count} document(s)`);
      const docs = await db.collection(colName).find({ email: 'prajwaldp03@gmail.com' }).toArray();
      console.log(docs);
    }
  }
  
  console.log('Searching for email: prajwaldp03@gmail.com case-insensitively...');
  for (let colInfo of collections) {
    const colName = colInfo.name;
    const count = await db.collection(colName).countDocuments({ email: /prajwaldp03@gmail\.com/i });
    if (count > 0) {
      console.log(`Found case-insensitively in collection "${colName}": ${count} document(s)`);
      const docs = await db.collection(colName).find({ email: /prajwaldp03@gmail\.com/i }).toArray();
      console.log(docs);
    }
  }

  mongoose.connection.close();
}).catch(err => {
  console.error('Connection failed:', err);
});

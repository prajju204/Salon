const mongoose = require('mongoose');

const directUri = 'mongodb://prajwaldp03_db_user:prajwal%402004@ac-bh7u8td-shard-00-00.sojqp2o.mongodb.net:27017/salon?ssl=true&authSource=admin&directConnection=true';

console.log('Testing direct single-shard connection...');

mongoose.connect(directUri, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000,
})
.then(() => {
  console.log('SUCCESS: Connected directly to shard successfully!');
  process.exit(0);
})
.catch(err => {
  console.error('FAILED: Direct connection failed!');
  console.error('Error details:', err.message);
  process.exit(1);
});

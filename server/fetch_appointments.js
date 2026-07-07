require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const appointments = await Appointment.find({});
    console.log("Total appointments:", appointments.length);
    console.log(appointments);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
test();

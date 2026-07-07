const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BarberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a barber name']
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  employeeId: {
    type: String,
    unique: true,
    sparse: true
  },
  gender: {
    type: String
  },
  mobileNumber: {
    type: String
  },
  specialization: {
    type: String
  },
  experienceYears: {
    type: Number,
    default: 0
  },
  availableWorkingDays: {
    type: [String],
    default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  workingTime: {
    type: String,
    default: '09:00 AM - 05:00 PM'
  },
  salary: {
    type: Number,
    default: 0
  },
  address: {
    type: String
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  role: {
    type: String,
    required: [true, 'Please add a role']
  },
  rating: {
    type: Number,
    default: 5.0
  },
  revenue: {
    type: Number,
    default: 0.0
  },
  completedBookings: {
    type: Number,
    default: 0
  },
  activeDays: {
    type: Number,
    default: 5
  },
  image: {
    type: String,
    default: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF2oOfX0IEdPCxqmQfKy_LRpiHYFpyIqgGKSYp7seSubUFyBNidldBY0QfL8DuvowILktYq-40hs3F4EjhYLswKqWOxjDCLPzuJHTl_NsRfxekhDrUpOsEqdAHn3ixK0nY6WTgsWY_pV-M6sogXrqj2OpwVJQvgSEX-lMK38SJuclC2wHD1iRPJZ2QsyZsrsPqALn81YqyZbTlLKeEhtFRNbIImHbZ63P8seZj9vWGLEQRFQHgwenODdn7wt5HQjaUF_m_ppyCPw'
  },
  skills: {
    type: [String],
    default: []
  },
  availability: {
    type: Map,
    of: [String],
    default: {}
  }
}, {
  timestamps: true
});

// Hash password using bcrypt
BarberSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user entered password to hashed password in database
BarberSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Barber', BarberSchema);

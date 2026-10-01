const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  clientName: {
    type: String,
    required: [true, 'Please add a client name']
  },
  clientEmail: {
    type: String,
    required: [true, 'Please add client email']
  },
  clientMobile: {
    type: String
  },
  serviceName: {
    type: String,
    required: [true, 'Please add service name']
  },
  price: {
    type: Number,
    required: [true, 'Please add price']
  },
  date: {
    type: String,
    required: [true, 'Please add date YYYY-MM-DD']
  },
  time: {
    type: String,
    required: [true, 'Please add time HH:MM']
  },
  barberId: {
    type: String,
    required: [true, 'Please add barber ID']
  },
  barberName: {
    type: String,
    required: [true, 'Please add barber name']
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled', 'Declined'],
    default: 'Pending'
  },
  // Customer reference (for loyalty & cancellation lookups)
  customerId: {
    type: String,
    default: null
  },
  // Coupon integration
  couponCode: {
    type: String,
    default: null
  },
  couponDiscount: {
    type: Number,
    default: 0
  },
  // Loyalty points integration
  loyaltyPointsRedeemed: {
    type: Number,
    default: 0
  },
  loyaltyDiscountAmount: {
    type: Number,
    default: 0
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  // Final amount after all discounts
  finalAmount: {
    type: Number,
    default: null
  },
  // Cancellation reference
  cancellationId: {
    type: String,
    default: null
  },

  // ─── Clinical Treatment Pipeline ──────────────────────────────────────────
  // Service category & doctor flag for filtering clinical appointments
  serviceCategory: { type: String, default: null },
  isDoctor: { type: Boolean, default: false },

  // Treatment notes from the doctor (visible to patient)
  treatmentNotes: { type: String, default: null },
  diagnosis: { type: String, default: null },
  sessionNumber: { type: Number, default: null },
  totalSessions: { type: Number, default: null },
  nextSessionDate: { type: String, default: null },
  treatmentUpdatedAt: { type: Date, default: null },
  treatmentUpdatedBy: { type: String, default: null },

  // Prescription issued by doctor (visible to patient)
  prescription: {
    medicines: [
      {
        name: { type: String },
        dose: { type: String },
        frequency: { type: String }
      }
    ],
    instructions: { type: String },
    dosageDetails: { type: String },
    followUpDate: { type: String, default: null },
    issuedBy: { type: String },
    issuedAt: { type: Date, default: null }
  },

  // Treatment payment record from doctor/staff (visible to patient)
  treatmentPayment: {
    // Doctor sets the actual total cost for this patient's treatment plan
    // (may differ from catalogue/booking price — e.g. based on grade, sessions)
    agreedTotalCost: { type: Number, default: null },

    // Overall payment status
    paymentStatus: { type: String, enum: ['Pending', 'Partial', 'Settled'], default: 'Pending' },

    // Payment plan description (e.g. "50% advance, balance after session 3")
    paymentPlanNotes: { type: String },

    // Multiple installment payments recorded over time
    payments: [
      {
        amount: { type: Number, required: true },
        paymentMode: { type: String, default: 'Cash' },
        referenceNumber: { type: String },    // UPI ref / transaction ID / cheque no
        paidOn: { type: Date, default: Date.now },
        remarks: { type: String },
        recordedBy: { type: String }
      }
    ],

    // Computed totals (kept in sync by controller)
    totalPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: null },

    recordedBy: { type: String },
    recordedAt: { type: Date, default: null }
  }
}, {
  timestamps: true
});

AppointmentSchema.index({ date: 1, time: 1, barberId: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);

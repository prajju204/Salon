const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a service name']
  },
  duration: {
    type: Number,
    required: [true, 'Please add a duration in minutes']
  },
  price: {
    type: Number,
    required: [true, 'Please add a pricing amount']
  },
  category: {
    type: String,
    required: [true, 'Please add a service category']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Both'],
    default: 'Both'
  },
  icon: {
    type: String,
    default: 'content_cut'
  },
  image: {
    type: String,
    default: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAbKUY4RwkAFYAZEDMMqs3xEOtgWpgLjbz_P9NFyTRZkLReF3zl4YLgGhkHaoE3Qi-Bdwu9N1hU1CZZd0uCs_GhCFAU2fBx4caf2gfdaAdhf10V_ZFJA_LQAGE6R8JtZ6dxCh6-_CGTIFBWgrm-atxyY7lUPywJ6oCRX_G8uIQ6dHcITaRS95MFtcRNpltdQkYjUFyx5s2TFy32SMZdbIh2_aHN9CajMHkOiMvD89baoiGQHUaEd523NNOBVVmzYokYMI5pdmfxQ'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Service', ServiceSchema);

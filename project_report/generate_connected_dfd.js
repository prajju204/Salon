import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Canvas dimensions
const width = 1500;
const height = 960;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      .bg { fill: #ffffff; }
      .entity-box { fill: #ffffff; stroke: #000000; stroke-width: 2.2; }
      .entity-title { font-family: 'Arial', 'Segoe UI', sans-serif; font-weight: bold; font-size: 17px; fill: #000000; text-anchor: middle; }
      .process-box { fill: #ffffff; stroke: #000000; stroke-width: 2.2; rx: 18; ry: 18; }
      .process-text { font-family: 'Arial', 'Segoe UI', sans-serif; font-weight: bold; font-size: 15px; fill: #000000; text-anchor: middle; }
      .datastore-line { stroke: #000000; stroke-width: 2.2; fill: none; }
      .datastore-id-box { fill: #ffffff; stroke: #000000; stroke-width: 2.2; }
      .datastore-id { font-family: 'Arial', sans-serif; font-weight: bold; font-size: 15px; fill: #000000; text-anchor: middle; }
      .datastore-text { font-family: 'Arial', sans-serif; font-weight: bold; font-size: 14.5px; fill: #000000; text-anchor: middle; }
      .flow-line { stroke: #000000; stroke-width: 1.6; fill: none; }
      .flow-label { font-family: 'Arial', 'Segoe UI', sans-serif; font-size: 12.5px; fill: #000000; font-weight: 600; }
      .flow-label-center { font-family: 'Arial', 'Segoe UI', sans-serif; font-size: 12.5px; fill: #000000; font-weight: 600; text-anchor: middle; }
    </style>
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#000000" />
    </marker>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" class="bg" />

  <!-- ==================== EXTERNAL ENTITIES ==================== -->
  <!-- Top-Left Customer / Client -->
  <rect x="50" y="80" width="165" height="120" class="entity-box" />
  <text x="132" y="135" class="entity-title">Customer /</text>
  <text x="132" y="160" class="entity-title">Client</text>

  <!-- Middle-Left Customer / Client (Bookings & Orders) -->
  <rect x="50" y="440" width="165" height="120" class="entity-box" />
  <text x="132" y="495" class="entity-title">Customer /</text>
  <text x="132" y="520" class="entity-title">Client</text>

  <!-- Bottom-Left Payment Gateway -->
  <rect x="50" y="800" width="165" height="110" class="entity-box" />
  <text x="132" y="855" class="entity-title">Payment</text>
  <text x="132" y="880" class="entity-title">Gateway</text>

  <!-- Top-Right Admin / Manager -->
  <rect x="1250" y="40" width="180" height="100" class="entity-box" />
  <text x="1340" y="85" class="entity-title">Admin /</text>
  <text x="1340" y="110" class="entity-title">Manager</text>

  <!-- Middle-Right Staff / Stylist -->
  <rect x="1250" y="450" width="180" height="100" class="entity-box" />
  <text x="1340" y="495" class="entity-title">Staff /</text>
  <text x="1340" y="520" class="entity-title">Stylist</text>

  <!-- Bottom-Right Delivery Personnel -->
  <rect x="1250" y="810" width="180" height="100" class="entity-box" />
  <text x="1340" y="855" class="entity-title">Delivery</text>
  <text x="1340" y="880" class="entity-title">Personnel</text>


  <!-- ==================== PROCESSES (NO NUMBERS) ==================== -->
  <!-- 1. User Authentication & Profile -->
  <g transform="translate(420, 75)">
    <rect width="240" height="90" class="process-box" />
    <text x="120" y="42" class="process-text">User Authentication</text>
    <text x="120" y="65" class="process-text">&amp; Profile</text>
  </g>

  <!-- 2. Salon Service & Appointment Engine -->
  <g transform="translate(420, 275)">
    <rect width="240" height="90" class="process-box" />
    <text x="120" y="42" class="process-text">Salon Service &amp;</text>
    <text x="120" y="65" class="process-text">Appointment Engine</text>
  </g>

  <!-- 3. E-Commerce & Order Management -->
  <g transform="translate(420, 540)">
    <rect width="240" height="90" class="process-box" />
    <text x="120" y="42" class="process-text">E-Commerce &amp;</text>
    <text x="120" y="65" class="process-text">Order Management</text>
  </g>

  <!-- 4. Feedback & Reviews System -->
  <g transform="translate(930, 425)">
    <rect width="240" height="90" class="process-box" />
    <text x="120" y="42" class="process-text">Feedback &amp; Reviews</text>
    <text x="120" y="65" class="process-text">System</text>
  </g>

  <!-- 5. Admin Reports & Analytics Engine -->
  <g transform="translate(1200, 220)">
    <rect width="240" height="90" class="process-box" />
    <text x="120" y="42" class="process-text">Admin Reports &amp;</text>
    <text x="120" y="65" class="process-text">Analytics Engine</text>
  </g>

  <!-- 6. Delivery & Dispatch Tracking -->
  <g transform="translate(790, 680)">
    <rect width="240" height="90" class="process-box" />
    <text x="120" y="42" class="process-text">Delivery &amp; Dispatch</text>
    <text x="120" y="65" class="process-text">Tracking</text>
  </g>


  <!-- ==================== DATA STORES ==================== -->
  <!-- D1 User Profile Data -->
  <g transform="translate(740, 95)">
    <rect x="0" y="0" width="40" height="50" class="datastore-id-box" />
    <text x="20" y="31" class="datastore-id">D1</text>
    <line x1="40" y1="0" x2="240" y2="0" class="datastore-line" />
    <line x1="40" y1="50" x2="240" y2="50" class="datastore-line" />
    <text x="140" y="31" class="datastore-text">User Profile Data</text>
  </g>

  <!-- D2 Appointments DB -->
  <g transform="translate(760, 295)">
    <rect x="0" y="0" width="40" height="50" class="datastore-id-box" />
    <text x="20" y="31" class="datastore-id">D2</text>
    <line x1="40" y1="0" x2="240" y2="0" class="datastore-line" />
    <line x1="40" y1="50" x2="240" y2="50" class="datastore-line" />
    <text x="140" y="31" class="datastore-text">Appointments DB</text>
  </g>

  <!-- D3 Products & Orders DB -->
  <g transform="translate(750, 560)">
    <rect x="0" y="0" width="40" height="50" class="datastore-id-box" />
    <text x="20" y="31" class="datastore-id">D3</text>
    <line x1="40" y1="0" x2="260" y2="0" class="datastore-line" />
    <line x1="40" y1="50" x2="260" y2="50" class="datastore-line" />
    <text x="150" y="31" class="datastore-text">Products &amp; Orders DB</text>
  </g>

  <!-- D4 Delivery Tracking DB -->
  <g transform="translate(1140, 700)">
    <rect x="0" y="0" width="40" height="50" class="datastore-id-box" />
    <text x="20" y="31" class="datastore-id">D4</text>
    <line x1="40" y1="0" x2="260" y2="0" class="datastore-line" />
    <line x1="40" y1="50" x2="260" y2="50" class="datastore-line" />
    <text x="150" y="31" class="datastore-text">Delivery Tracking DB</text>
  </g>

  <!-- D5 Reviews DB -->
  <g transform="translate(1180, 575)">
    <rect x="0" y="0" width="40" height="50" class="datastore-id-box" />
    <text x="20" y="31" class="datastore-id">D5</text>
    <line x1="40" y1="0" x2="220" y2="0" class="datastore-line" />
    <line x1="40" y1="50" x2="220" y2="50" class="datastore-line" />
    <text x="130" y="31" class="datastore-text">Reviews DB</text>
  </g>


  <!-- ==================== FLOW ARROWS & LABELS ==================== -->

  <!-- Customer -> Auth (Login Credentials) -->
  <path d="M 215 105 L 420 105" class="flow-line" marker-end="url(#arrow)" />
  <text x="235" y="95" class="flow-label">Login Credentials</text>

  <!-- Customer -> Auth (Profile Updates) -->
  <path d="M 215 135 L 420 135" class="flow-line" marker-end="url(#arrow)" />
  <text x="245" y="127" class="flow-label">Profile Updates</text>

  <!-- Auth -> Customer (Profile Status) -->
  <path d="M 420 160 L 215 160" class="flow-line" marker-end="url(#arrow)" />
  <text x="250" y="153" class="flow-label">Profile Status</text>

  <!-- Auth <-> D1 User Data -->
  <path d="M 660 120 L 740 120" class="flow-line" marker-end="url(#arrow)" />
  <text x="670" y="112" class="flow-label">User Data</text>

  <!-- Top Customer down connector to Middle Customer -->
  <path d="M 132 200 L 132 440" class="flow-line" marker-end="url(#arrow)" />

  <!-- Middle Customer -> Salon Engine (Service Selection) -->
  <path d="M 175 440 L 175 300 L 420 300" class="flow-line" marker-end="url(#arrow)" />
  <text x="220" y="290" class="flow-label">Service Selection</text>

  <!-- Middle Customer -> Salon Engine (Stylist & Date/Time) -->
  <path d="M 195 440 L 195 330 L 420 330" class="flow-line" marker-end="url(#arrow)" />
  <text x="220" y="322" class="flow-label">Stylist &amp; Date/Time</text>

  <!-- Salon Engine -> Middle Customer (Booking Confirmation) -->
  <path d="M 420 355 L 215 355 L 215 440" class="flow-line" marker-end="url(#arrow)" />
  <text x="220" y="350" class="flow-label">Booking Confirmation</text>

  <!-- Salon Engine -> D2 Appointments DB -->
  <path d="M 660 320 L 760 320" class="flow-line" marker-end="url(#arrow)" />
  <text x="668" y="312" class="flow-label">Slot Reservation</text>

  <!-- Salon Engine -> E-Commerce -->
  <path d="M 540 365 L 540 540" class="flow-line" marker-end="url(#arrow)" />

  <!-- Middle Customer -> E-Commerce (Browse & Add to Cart) -->
  <path d="M 215 480 L 420 480 L 420 540" class="flow-line" marker-end="url(#arrow)" />
  <text x="235" y="472" class="flow-label">Browse &amp; Add to Cart</text>

  <!-- Middle Customer -> E-Commerce (Order Requests) -->
  <path d="M 215 520 L 320 520 L 320 570 L 420 570" class="flow-line" marker-end="url(#arrow)" />
  <text x="235" y="513" class="flow-label">Order Requests</text>

  <!-- E-Commerce <-> Payment Gateway (WITH CLEAN CLEARANCE / NO TOUCHING) -->
  <!-- Payment Details: nicely floating ABOVE line -->
  <path d="M 420 610 L 215 825" class="flow-line" marker-end="url(#arrow)" />
  <text x="235" y="680" class="flow-label">Payment Details</text>

  <!-- Payment Confirmation: nicely floating BELOW line -->
  <path d="M 215 865 L 420 625" class="flow-line" marker-end="url(#arrow)" />
  <text x="260" y="775" class="flow-label">Payment Confirmation</text>

  <!-- E-Commerce -> D3 Products & Orders DB -->
  <path d="M 660 585 L 750 585" class="flow-line" marker-end="url(#arrow)" />
  <text x="668" y="577" class="flow-label">Order Details</text>

  <!-- E-Commerce -> Delivery Dispatch Tracking -->
  <path d="M 560 630 L 560 725 L 790 725" class="flow-line" marker-end="url(#arrow)" />
  <text x="590" y="717" class="flow-label">Dispatch Assignment</text>

  <!-- Delivery Tracking -> D4 Delivery Tracking DB -->
  <path d="M 1030 725 L 1140 725" class="flow-line" marker-end="url(#arrow)" />
  <text x="1040" y="717" class="flow-label">Milestone Logs</text>

  <!-- Delivery Personnel <-> Delivery Tracking -->
  <path d="M 1250 860 L 880 860 L 880 770" class="flow-line" marker-end="url(#arrow)" />
  <text x="940" y="852" class="flow-label">Status Updates (Out for Delivery / Delivered)</text>

  <!-- Customer -> Feedback & Reviews System -->
  <path d="M 215 460 L 930 460" class="flow-line" marker-end="url(#arrow)" />
  <text x="540" y="452" class="flow-label">Rating &amp; Feedback</text>

  <!-- Feedback System -> Staff / Stylist -->
  <path d="M 1170 470 L 1250 470" class="flow-line" marker-end="url(#arrow)" />
  <text x="1178" y="462" class="flow-label">Staff Feedback</text>

  <!-- Feedback System -> D5 Reviews DB -->
  <path d="M 1050 515 L 1050 600 L 1180 600" class="flow-line" marker-end="url(#arrow)" />
  <text x="1060" y="592" class="flow-label">Save Review</text>

  <!-- Admin <-> Analytics Engine -->
  <path d="M 1310 140 L 1310 220" class="flow-line" marker-end="url(#arrow)" />
  <text x="1190" y="180" class="flow-label">System Config &amp; Management</text>
  <path d="M 1370 220 L 1370 140" class="flow-line" marker-end="url(#arrow)" />
  <text x="1380" y="180" class="flow-label">Revenue &amp; Sales Reports</text>

</svg>
`;

const outputPath = path.join(__dirname, 'luxe_groom_connected_dfd.svg');
fs.writeFileSync(outputPath, svg, 'utf-8');
console.log('Saved perfect SVG to: ' + outputPath);

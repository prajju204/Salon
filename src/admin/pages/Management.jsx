import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";
import { API_BASE } from "@/shared/utils/api";
import { toast } from 'sonner';
import axios from 'axios';
import html2pdf from 'html2pdf.js';

// ── Image helpers ───────────────────────────────────────────────────────────
const DEFAULT_AVATAR = `${API_BASE}/uploads/default-avatar.png`;

/**
 * Resolves any image src to an absolute URL.
 * - Full http/https URLs → returned as-is
 * - /uploads/... paths  → prefixed with API_BASE
 * - data: URLs          → returned as-is (local preview)
 * - empty/null          → returns DEFAULT_AVATAR
 */
const resolveImageUrl = (src) => {
  if (!src) return DEFAULT_AVATAR;
  if (src.startsWith('data:') || src.startsWith('http')) return src;
  if (src.startsWith('/')) return `${API_BASE}${src}`;
  return src;
};

const FALLBACK_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF2oOfX0IEdPCxqmQfKy_LRpiHYFpyIqgGKSYp7seSubUFyBNidldBY0QfL8DuvowILktYq-40hs3F4EjhYLswKqWOxjDCLPzuJHTl_NsRfxekhDrUpOsEqdAHn3ixK0nY6WTgsWY_pV-M6sogXrqj2OpwVJQvgSEX-lMK38SJuclC2wHD1iRPJZ2QsyZsrsPqALn81YqyZbTlLKeEhtFRNbIImHbZ63P8seZj9vWGLEQRFQHgwenODdn7wt5HQjaUF_m_ppyCPw';
// ────────────────────────────────────────────────────────────────────────────

const Management = () => {
  const location = useLocation();
  const { 
    barbers, addBarber, updateBarber, deleteBarber,
    services, addService, updateService, deleteService,
    appointments, updateAppointmentStatus, confirmBooking, declineBooking,
    refreshData
  } = useApp();

  useEffect(() => {
    refreshData();
  }, []);

  const handleSendWhatsAppNotification = (apt) => {
    const phone = apt.clientMobile ? apt.clientMobile.replace(/[^\d]/g, '') : '';
    const message = `Hello *${apt.clientName || 'Valued Client'}*,\n\n` +
      `Here are your booking details for *Luxe Groom*:\n\n` +
      `💇‍♂️ *Service:* ${apt.serviceName}\n` +
      `📅 *Date:* ${apt.date}\n` +
      `⏰ *Time:* ${apt.time}\n` +
      `💈 *Stylist:* ${apt.barberName}\n` +
      `💰 *Price:* ₹${apt.price}\n` +
      `📌 *Status:* ${apt.status}\n\n` +
      `Thank you for booking with us!`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendStaffWhatsAppNotification = (apt) => {
    const barber = barbers.find(b => b.name === apt.barberName || b._id === apt.barberId || b.id === apt.barberId);
    const phone = barber && barber.mobileNumber ? barber.mobileNumber.replace(/[^\d]/g, '') : '';
    
    if (!phone) {
      toast.error(`Could not find mobile number for stylist ${apt.barberName || 'selected stylist'}`);
      return;
    }

    const message = `Hello *${apt.barberName}*,\n\n` +
      `Here is a booking assigned to you at *Luxe Groom*:\n\n` +
      `💇‍♂️ *Service:* ${apt.serviceName}\n` +
      `👤 *Client:* ${apt.clientName}\n` +
      `📞 *Client Phone:* ${apt.clientMobile || 'N/A'}\n` +
      `📅 *Date:* ${apt.date}\n` +
      `⏰ *Time:* ${apt.time}\n` +
      `📌 *Status:* ${apt.status}\n\n` +
      `Please check the schedule board.`;

    const encodedText = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedText}`;
    window.open(whatsappUrl, '_blank');
  };

  // Determine current active view based on path
  const path = location.pathname;
  let activeView = 'barbers';
  if (path.includes('services')) activeView = 'services';
  else if (path.includes('customers')) activeView = 'customers';
  else if (path.includes('appointments')) activeView = 'appointments';
  else if (path.includes('reports')) activeView = 'reports';
  else if (path.includes('settings')) activeView = 'settings';

  // --- STAFF MANAGEMENT STATE ---
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Barber Stylist');
  const [staffImage, setStaffImage] = useState(''); // final image URL saved to DB
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffUsername, setStaffUsername] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [showStaffPassword, setShowStaffPassword] = useState(false);
  const [staffGender, setStaffGender] = useState('');
  const [staffMobile, setStaffMobile] = useState('');

  // --- SETTINGS STATE & ACTIONS ---
  const [salonSettings, setSalonSettings] = useState({
    openingTime: '09:00 AM',
    closingTime: '09:00 PM',
    slotInterval: 30,
    maxBookingsPerSlot: 1,
    holidays: [],
    breakStart: '01:00 PM',
    breakEnd: '02:00 PM'
  });

  const getAuthHeader = () => {
    const token = localStorage.getItem('luxe_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/admin/settings`, { headers: getAuthHeader() });
      if (res.data.success) {
        setSalonSettings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  }, []);

  React.useEffect(() => {
    if (activeView === 'settings') {
      fetchSettings();
    }
  }, [activeView, fetchSettings]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_BASE}/api/admin/settings`, salonSettings, { headers: getAuthHeader() });
      if (res.data.success) {
        toast.success('Salon parameters saved successfully!');
      }
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };
  const [staffSpecialization, setStaffSpecialization] = useState('');
  const [staffExperience, setStaffExperience] = useState('');
  const [staffWorkingTime, setStaffWorkingTime] = useState('09:00 AM - 05:00 PM');
  const [staffSalary, setStaffSalary] = useState('');
  const [staffAddress, setStaffAddress] = useState('');
  const [staffStatus, setStaffStatus] = useState('Active');
  
  // --- STAFF FILTERS ---
  const [staffSearch, setStaffSearch] = useState('');
  const [staffFilterStatus, setStaffFilterStatus] = useState('All');

  // --- DELETE STAFF MODAL ---
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // --- IMAGE UPLOAD STATE ---
  const [imageFile, setImageFile] = useState(null);       // raw File object
  const [imagePreview, setImagePreview] = useState('');   // data URL for preview
  const [imageError, setImageError] = useState('');       // validation error text
  const [isDragging, setIsDragging] = useState(false);   // drag-over highlight
  const [isUploading, setIsUploading] = useState(false); // upload in progress
  const fileInputRef = useRef(null);

  // --- SERVICE MANAGEMENT STATE ---
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Haircut');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceStatus, setServiceStatus] = useState('Active');
  const [serviceImage, setServiceImage] = useState('');
  const [serviceFilterTab, setServiceFilterTab] = useState('All');
  const [editingServiceId, setEditingServiceId] = useState(null);

  // --- SEARCH & FILTER STATES ---
  const [customerSearch, setCustomerSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [aptStatusFilter, setAptStatusFilter] = useState('All');

  // --- DECLINE MODAL STATE ---
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineBookingId, setDeclineBookingId] = useState('');
  const [declineReason, setDeclineReason] = useState('');

  const handleDeclineClick = (bookingId) => {
    setDeclineBookingId(bookingId);
    setDeclineReason('');
    setDeclineOpen(true);
  };

  const handleDeclineSubmit = (e) => {
    e.preventDefault();
    declineBooking(declineBookingId, declineReason);
    setDeclineOpen(false);
  };

  // --- IMAGE UPLOAD HELPERS ---
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const MAX_SIZE_MB = 5;

  const applyImageFile = (file) => {
    if (!file) return;
    setImageError('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Invalid file type. Please upload a JPG, JPEG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setImageError(`File too large. Maximum allowed size is ${MAX_SIZE_MB} MB.`);
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => applyImageFile(e.target.files[0]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    applyImageFile(file);
  }, []);

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetStaffModal = () => {
    setStaffName('');
    setStaffRole('Barber Stylist');
    setStaffImage('');
    setStaffEmail('');
    setStaffUsername('');
    setStaffPassword('');
    setStaffGender('');
    setStaffMobile('');
    setStaffSpecialization('');
    setStaffExperience('');
    setStaffWorkingTime('09:00 AM - 05:00 PM');
    setStaffSalary('');
    setStaffAddress('');
    setStaffStatus('Active');
    setImageFile(null);
    setImagePreview('');
    setImageError('');
    setEditingStaffId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- ACTION HANDLERS ---
  const handleAddStaff = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!staffName || !staffName.trim()) {
      toast.error('Stylist Name is required');
      return;
    }
    if (!staffUsername || !staffUsername.trim()) {
      toast.error('Username is required');
      return;
    }
    if (staffUsername.includes(' ')) {
      toast.error('Username cannot contain spaces');
      return;
    }
    if (staffEmail && !/^\S+@\S+\.\S+$/.test(staffEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (staffMobile && !/^\+?[0-9\-\s]{10,15}$/.test(staffMobile)) {
      toast.error('Please enter a valid mobile number');
      return;
    }
    if (!editingStaffId && (!staffPassword || staffPassword.length < 6)) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (editingStaffId && staffPassword && staffPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (staffSalary && Number(staffSalary) < 0) {
      toast.error('Salary cannot be negative');
      return;
    }
    if (staffExperience && Number(staffExperience) < 0) {
      toast.error('Experience cannot be negative');
      return;
    }

    setIsUploading(true);
    try {
      let finalImageUrl = staffImage; // keep existing URL when editing

      // If admin chose a new file, upload it first
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        try {
          // ⚠️  Do NOT set Content-Type manually — axios auto-sets
          // 'multipart/form-data; boundary=...' when it detects FormData.
          // Manually setting it omits the boundary and breaks multer parsing.
          const res = await axios.post(`${API_BASE}/api/admin/upload`, formData);
          if (res.data?.success && res.data.imageUrl) {
            finalImageUrl = res.data.imageUrl;
          } else {
            // Server responded but without a valid URL → use local preview
            finalImageUrl = imagePreview || staffImage;
          }
        } catch (uploadErr) {
          // Server unreachable → fall back to local data-URL so image still shows
          console.warn('Server upload failed, using local data-URL as fallback.', uploadErr);
          finalImageUrl = imagePreview || staffImage;
        }
      } else if (!finalImageUrl && imagePreview) {
        // No file object but we have a preview (e.g. existing editing flow)
        finalImageUrl = imagePreview;
      }

      if (editingStaffId) {
        const existing = barbers.find(b => b.id === editingStaffId || b._id === editingStaffId);
        await updateBarber({
          ...existing,
          name: staffName,
          role: staffRole,
          image: finalImageUrl || existing.image,
          email: staffEmail,
          username: staffUsername,
          gender: staffGender,
          mobileNumber: staffMobile,
          specialization: staffSpecialization,
          experienceYears: staffExperience ? parseInt(staffExperience) : 0,
          workingTime: staffWorkingTime,
          salary: staffSalary ? parseFloat(staffSalary) : 0,
          address: staffAddress,
          status: staffStatus
        });
        
        if (staffPassword) {
           await axios.put(`${API_BASE}/api/admin/barbers/${editingStaffId}/reset-password`, 
             { password: staffPassword }, 
             { headers: { Authorization: `Bearer ${localStorage.getItem('luxe_admin_token')}` } }
           );
           toast.success('Password updated successfully');
        }
      } else {
        await addBarber({
          name: staffName,
          role: staffRole,
          image: finalImageUrl || undefined,
          email: staffEmail,
          username: staffUsername,
          password: staffPassword,
          gender: staffGender,
          mobileNumber: staffMobile,
          specialization: staffSpecialization,
          experienceYears: staffExperience ? parseInt(staffExperience) : 0,
          workingTime: staffWorkingTime,
          salary: staffSalary ? parseFloat(staffSalary) : 0,
          address: staffAddress,
          status: staffStatus
        });
      }
    } finally {
      setIsUploading(false);
      resetStaffModal();
      setShowAddStaffModal(false);
    }
  };

  const handleDeleteClick = (barber) => {
    setStaffToDelete(barber);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!staffToDelete) return;
    try {
      await deleteBarber(staffToDelete.id || staffToDelete._id);
    } catch (err) {
      console.error("API Error during deletion:", err.response?.data?.message || err.message || err);
    } finally {
      setShowDeleteConfirmModal(false);
      setStaffToDelete(null);
    }
  };

  const handleEditStaffClick = (barber) => {
    setEditingStaffId(barber.id || barber._id);
    setStaffName(barber.name);
    setStaffRole(barber.role);
    setStaffImage(barber.image || '');
    setStaffEmail(barber.email || '');
    setStaffUsername(barber.username || '');
    setStaffPassword('');
    setStaffGender(barber.gender || '');
    setStaffMobile(barber.mobileNumber || '');
    setStaffSpecialization(barber.specialization || '');
    setStaffExperience(barber.experienceYears?.toString() || '');
    setStaffWorkingTime(barber.workingTime || '09:00 AM - 05:00 PM');
    setStaffSalary(barber.salary?.toString() || '');
    setStaffAddress(barber.address || '');
    setStaffStatus(barber.status || 'Active');
    
    // Show existing image as preview
    setImagePreview(barber.image || '');
    setImageFile(null);
    setImageError('');
    setShowAddStaffModal(true);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let finalImageUrl = serviceImage;

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        try {
          const res = await axios.post(`${API_BASE}/api/admin/upload`, formData);
          if (res.data?.success && res.data.imageUrl) {
            finalImageUrl = res.data.imageUrl;
          } else {
            finalImageUrl = imagePreview || serviceImage;
          }
        } catch (uploadErr) {
          console.warn('Server upload failed, using local data-URL as fallback.', uploadErr);
          finalImageUrl = imagePreview || serviceImage;
        }
      } else if (!finalImageUrl && imagePreview) {
        finalImageUrl = imagePreview;
      }

      const serviceData = {
        name: serviceName,
        price: parseFloat(servicePrice),
        duration: parseInt(serviceDuration),
        category: serviceCategory,
        description: serviceDesc,
        image: finalImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAbKUY4RwkAFYAZEDMMqs3xEOtgWpgLjbz_P9NFyTRZkLReF3zl4YLgGhkHaoE3Qi-Bdwu9N1hU1CZZd0uCs_GhCFAU2fBx4caf2gfdaAdhf10V_ZFJA_LQAGE6R8JtZ6dxCh6-_CGTIFBWgrm-atxyY7lUPywJ6oCRX_G8uIQ6dHcITaRS95MFtcRNpltdQkYjUFyx5s2TFy32SMZdbIh2_aHN9CajMHkOiMvD89baoiGQHUaEd523NNOBVVmzYokYMI5pdmfxQ',
        status: serviceStatus
      };

      if (editingServiceId) {
        const existing = services.find(s => s.id === editingServiceId || s._id === editingServiceId);
        await updateService({ ...existing, ...serviceData });
      } else {
        await addService(serviceData);
      }
    } finally {
      setIsUploading(false);
      setEditingServiceId(null);
      setServiceName('');
      setServicePrice('');
      setServiceDuration('');
      setServiceDesc('');
      setServiceCategory('Haircut');
      setServiceStatus('Active');
      setServiceImage('');
      setImageFile(null);
      setImagePreview('');
      setImageError('');
      setShowAddServiceModal(false);
    }
  };

  const handleEditServiceClick = (service) => {
    setEditingServiceId(service.id || service._id);
    setServiceName(service.name);
    setServicePrice(service.price?.toString() || '');
    setServiceDuration(service.duration?.toString() || '');
    setServiceCategory(service.category || 'Haircut');
    setServiceDesc(service.description || '');
    setServiceStatus(service.status || 'Active');
    setServiceImage(service.image || '');
    setImageFile(null);
    setImagePreview('');
    setImageError('');
    setShowAddServiceModal(true);
  };

  // Get unique clients lists
  const uniqueClients = React.useMemo(() => {
    const clientsMap = {};
    appointments.forEach(apt => {
      if (!clientsMap[apt.clientEmail]) {
        clientsMap[apt.clientEmail] = {
          name: apt.clientName,
          email: apt.clientEmail,
          appointmentsCount: 0,
          totalSpent: 0
        };
      }
      clientsMap[apt.clientEmail].appointmentsCount += 1;
      if (apt.status === 'Completed') {
        clientsMap[apt.clientEmail].totalSpent += apt.price;
      }
    });
    return Object.values(clientsMap);
  }, [appointments]);

  // Filter lists based on searches
  const filteredClients = uniqueClients.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.email.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const filteredAppointments = appointments.filter(a => {
    const matchesSearch = 
      (a.clientName || '').toLowerCase().includes(appointmentSearch.toLowerCase()) || 
      (a.clientEmail || '').toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      (a.serviceName || '').toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      (a.barberName || '').toLowerCase().includes(appointmentSearch.toLowerCase()) ||
      (a.notes || '').toLowerCase().includes(appointmentSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (aptStatusFilter === 'Upcoming') {
      return ['Pending', 'Confirmed', 'In Progress'].includes(a.status);
    }
    if (aptStatusFilter === 'Completed' || aptStatusFilter === 'History') {
      return a.status === 'Completed';
    }
    if (aptStatusFilter === 'Cancelled') {
      return ['Cancelled', 'Declined'].includes(a.status);
    }
    if (aptStatusFilter === 'Pending') {
      return a.status === 'Pending';
    }
    return true;
  });

  const filteredBarbers = barbers.filter(barber => {
    const matchesSearch = staffSearch === '' || 
      barber.name.toLowerCase().includes(staffSearch.toLowerCase()) || 
      (barber.role && barber.role.toLowerCase().includes(staffSearch.toLowerCase())) ||
      (barber.email && barber.email.toLowerCase().includes(staffSearch.toLowerCase()));
      
    const matchesStatus = staffFilterStatus === 'All' || barber.status === staffFilterStatus || (!barber.status && staffFilterStatus === 'Active');
    
    return matchesSearch && matchesStatus;
  });

  const activeStaffCount = barbers.filter(b => !b.status || b.status === 'Active').length;
  const inactiveStaffCount = barbers.filter(b => b.status === 'Inactive').length;

  return (
    <main className="pt-28 px-4 md:px-8 max-w-[1600px] mx-auto font-body pb-32">

      {activeView === 'barbers' && (
        <div className="space-y-8">

          {/* ── Page Header ── */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-headline text-on-surface tracking-tight">Staff &amp; Barbers</h2>
              <p className="text-sm text-on-surface-variant mt-1">Manage your grooming specialists — hire, edit, or remove team members.</p>
            </div>
            <button
              onClick={() => { resetStaffModal(); setShowAddStaffModal(true); }}
              className="self-start sm:self-auto flex items-center gap-2 bg-primary text-on-primary text-xs uppercase tracking-widest font-bold py-3.5 px-7 rounded-2xl
                shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:brightness-110
                active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add Stylist
            </button>
          </div>

          {/* Summary and Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-surface-container/50 p-4 rounded-2xl border border-white/5 gap-4">
            <div className="flex gap-4 sm:gap-8 w-full md:w-auto">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Total</span>
                <p className="text-2xl font-headline text-on-surface">{barbers.length}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Active</span>
                <p className="text-2xl font-headline text-on-surface">{activeStaffCount}</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <span className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Inactive</span>
                <p className="text-2xl font-headline text-on-surface">{inactiveStaffCount}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search staff..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="bg-background border border-white/10 rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none min-w-[200px]"
              />
              <select
                value={staffFilterStatus}
                onChange={(e) => setStaffFilterStatus(e.target.value)}
                className="bg-background border border-white/10 rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary/50 focus:outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* ── Staff Cards Grid ── */}
          {/* pt-8 so the -mt-12 avatar never clips behind the fixed header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pt-8">
            {filteredBarbers.map(barber => {
              const totalBookings = appointments.filter(a => a.barberId === (barber.id || barber._id) || a.barberName === barber.name).length;
              return (
              <div
                key={barber.id}
                className="relative flex flex-col rounded-[20px] border border-white/8
                  bg-gradient-to-b from-surface-container to-background
                  shadow-[0_8px_32px_rgba(0,0,0,0.45)]
                  hover:shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(212,175,55,0.25)]
                  hover:-translate-y-1.5 transition-all duration-300 group"
              >
                {/* ── Gold gradient banner ── */}
                <div
                  className="relative h-20 rounded-t-[20px] overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.25) 0%, rgba(212,175,55,0.06) 50%, rgba(0,0,0,0.3) 100%)'
                  }}
                >
                  {/* Subtle diagonal lines pattern */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, rgba(212,175,55,0.4) 0px, rgba(212,175,55,0.4) 1px, transparent 1px, transparent 12px)'
                    }}
                  />
                  {/* Rating badge — top right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full
                    bg-black/60 backdrop-blur-sm border border-primary/30">
                    <span className="material-symbols-outlined text-[12px] text-primary">star</span>
                    <span className="text-[11px] font-black text-primary tracking-wider">{barber.rating}</span>
                  </div>
                  {/* Active/Inactive dot — top left */}
                  <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full">
                    <span className={`w-2 h-2 rounded-full ${barber.status === 'Inactive' ? 'bg-red-500' : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse'}`} />
                    <span className={`text-[9px] ${barber.status === 'Inactive' ? 'text-red-400' : 'text-emerald-400'} font-bold uppercase tracking-wider`}>
                      {barber.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* ── Avatar — overlaps banner with -mt-12 ── */}
                <div className="flex justify-center -mt-12 px-4 z-10 relative">
                  <div
                    className="w-24 h-24 rounded-full overflow-hidden
                      border-[3px] border-background bg-surface-container
                      shadow-[0_4px_16px_rgba(0,0,0,0.4)]
                      ring-2 ring-primary/30 group-hover:ring-primary/70
                      transition-all duration-300 group-hover:scale-105"
                  >
                    <img
                      className="w-full h-full object-cover"
                      src={resolveImageUrl(barber.image)}
                      alt={barber.name}
                      loading="lazy"
                      onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }}
                    />
                  </div>
                </div>

                {/* ── Info section ── */}
                <div className="px-4 pt-3 pb-3 text-center flex-1 flex flex-col">
                  <h3 className="font-headline text-lg text-on-surface leading-tight truncate">{barber.name}</h3>

                  {/* Gold accent line */}
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="flex-1 h-px bg-gradient-to-r from-transparent to-primary/30" />
                    <p className="text-[9px] text-primary uppercase tracking-[0.1em] font-bold truncate">{barber.role}</p>
                    <span className="flex-1 h-px bg-gradient-to-l from-transparent to-primary/30" />
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-white/4 rounded-lg p-2 border border-white/6 hover:border-primary/20 transition-colors">
                      <span className="material-symbols-outlined text-[14px] text-primary block mb-0.5">payments</span>
                      <span className="text-[8px] text-on-surface-variant block uppercase font-bold tracking-widest">Rev</span>
                      <span className="text-xs font-black text-primary mt-0.5 block truncate">{formatCurrency(barber.revenue)}</span>
                    </div>
                    <div className="bg-white/4 rounded-lg p-2 border border-white/6 hover:border-primary/20 transition-colors">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant block mb-0.5">event_available</span>
                      <span className="text-[8px] text-on-surface-variant block uppercase font-bold tracking-widest">Bookings</span>
                      <span className="text-xs font-black text-on-surface mt-0.5 block truncate">{totalBookings}</span>
                    </div>
                  </div>

                  {/* Spacer pushes buttons to bottom */}
                  <div className="flex-1" />
                </div>

                {/* ── Bottom action bar ── */}
                <div className="px-3 pb-4 pt-1 flex gap-2">
                  {/* Edit — gold */}
                  <button
                    onClick={() => handleEditStaffClick(barber)}
                    className="flex-1 flex flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                      bg-primary/10 border border-primary/20 text-primary
                      hover:bg-primary/25 hover:border-primary/50 hover:shadow-[0_4px_16px_rgba(212,175,55,0.2)]
                      active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    Edit
                  </button>
                  {/* Remove — red */}
                  <button
                    onClick={() => handleDeleteClick(barber)}
                    className="flex-1 flex flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider
                      bg-red-500/10 border border-red-500/20 text-red-400
                      hover:bg-red-500/20 hover:border-red-500/50 hover:shadow-[0_4px_16px_rgba(239,68,68,0.2)]
                      active:scale-95 transition-all duration-200 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    Remove
                  </button>
                </div>
              </div>
            )})}

            {/* Empty state when no staff added */}
            {filteredBarbers.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-24 text-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-primary">group_add</span>
                </div>
                <div>
                  <p className="text-on-surface font-semibold text-lg">No staff added yet</p>
                  <p className="text-on-surface-variant text-sm mt-1">Click "Add Stylist" to hire your first team member.</p>
                </div>
              </div>
            )}
          </div>

          {/* Add/Edit Staff Modal */}
          {showAddStaffModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="glass-panel p-8 rounded-2xl w-full max-w-4xl border border-white/10 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-headline text-on-surface mb-6">
                  {editingStaffId ? 'Edit Stylist Profile' : 'Hire New Stylist'}
                </h3>
                <form onSubmit={handleAddStaff} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Column 1 */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Stylist Name *</label>
                        <input type="text" value={staffName} onChange={(e) => setStaffName(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface" placeholder="e.g. Elena Rossi" required />
                      </div>
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Username *</label>
                        <input type="text" value={staffUsername} onChange={(e) => setStaffUsername(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface" placeholder="staff123" required />
                      </div>
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Email Address</label>
                        <input type="email" value={staffEmail} onChange={(e) => setStaffEmail(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface" placeholder="staff@example.com" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Password {editingStaffId ? '(Leave blank to keep current)' : '*'}</label>
                        <div className="relative">
                          <input
                            type={showStaffPassword ? "text" : "password"}
                            value={staffPassword}
                            onChange={(e) => setStaffPassword(e.target.value)}
                            className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:border-primary text-on-surface"
                            placeholder="Password"
                            required={!editingStaffId}
                          />
                          <button
                            type="button"
                            onClick={() => setShowStaffPassword(!showStaffPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {showStaffPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Gender</label>
                          <select value={staffGender} onChange={(e) => setStaffGender(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface">
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Mobile Number</label>
                          <input type="tel" value={staffMobile} onChange={(e) => setStaffMobile(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface" placeholder="+1..." />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Title / Role</label>
                        <select value={staffRole} onChange={(e) => setStaffRole(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface">
                          <option value="Master Barber">Master Barber</option>
                          <option value="Barber Stylist">Barber Stylist</option>
                          <option value="Creative Stylist">Creative Stylist</option>
                          <option value="Dermatology & Skin Expert">Dermatology & Skin Expert</option>
                          <option value="Color Specialist">Color Specialist</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Status</label>
                        <select value={staffStatus} onChange={(e) => setStaffStatus(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface">
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Specialization</label>
                        <input type="text" value={staffSpecialization} onChange={(e) => setStaffSpecialization(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface" placeholder="e.g. Fades, Coloring" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Experience (Yrs)</label>
                          <input type="number" value={staffExperience} onChange={(e) => setStaffExperience(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface" min="0" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Salary ($)</label>
                          <input type="number" value={staffSalary} onChange={(e) => setStaffSalary(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface" min="0" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Working Time</label>
                        <input type="text" value={staffWorkingTime} onChange={(e) => setStaffWorkingTime(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface" placeholder="09:00 AM - 05:00 PM" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Address</label>
                        <input type="text" value={staffAddress} onChange={(e) => setStaffAddress(e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface" placeholder="Home address" />
                      </div>
                      
                      {/* ── Image Upload Zone ── */}
                      <div>
                        <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Staff Photo</label>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFileInputChange} />
                        {imagePreview ? (
                          <div className="relative rounded-xl overflow-hidden border border-primary/30 bg-surface-container h-36">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-primary/80 transition-colors">
                                <span className="material-symbols-outlined text-[14px]">swap_horiz</span> Replace
                              </button>
                              <button type="button" onClick={handleRemoveImage} className="flex items-center gap-1.5 bg-white/10 backdrop-blur border border-white/20 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg hover:bg-red-500/80 transition-colors">
                                <span className="material-symbols-outlined text-[14px]">delete</span> Remove
                              </button>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-3 py-1.5 flex items-center justify-between">
                              <span className="text-[10px] text-white/80 truncate max-w-[75%]">{imageFile ? imageFile.name : 'Current photo'}</span>
                              {imageFile && <span className="text-[9px] text-primary font-bold uppercase tracking-wider">{(imageFile.size / 1024 / 1024).toFixed(1)} MB</span>}
                            </div>
                          </div>
                        ) : (
                          <div role="button" tabIndex={0} onClick={() => fileInputRef.current?.click()} onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`w-full h-36 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all select-none ${isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-white/20 bg-surface-container hover:border-primary/50 hover:bg-primary/5'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-primary/20' : 'bg-white/5'}`}>
                              <span className={`material-symbols-outlined text-2xl transition-colors ${isDragging ? 'text-primary' : 'text-on-surface-variant'}`}>cloud_upload</span>
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-semibold text-on-surface">{isDragging ? 'Drop image here' : 'Drag & drop or click to upload'}</p>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">JPG, JPEG, PNG, WEBP · Max 5 MB</p>
                            </div>
                          </div>
                        )}
                        {imageError && (
                          <div className="mt-2 flex items-start gap-1.5 text-red-400">
                            <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0">error</span>
                            <p className="text-[11px]">{imageError}</p>
                          </div>
                        )}
                      </div>
                      {/* ── End Upload Zone ── */}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => { resetStaffModal(); setShowAddStaffModal(false); }}
                      className="px-4 py-2 border border-white/10 text-xs uppercase font-bold rounded-lg text-on-surface-variant hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading || !!imageError}
                      className="px-6 py-2 bg-primary text-on-primary text-xs uppercase font-bold rounded-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 transition-opacity"
                    >
                      {isUploading ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                          Saving…
                        </>
                      ) : 'Save Stylist'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirmModal && staffToDelete && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="glass-panel p-8 rounded-2xl w-full max-w-md border border-white/10 relative" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-headline text-on-surface mb-4 text-red-400 flex items-center gap-2">
                  <span className="material-symbols-outlined">warning</span> Remove Barber
                </h3>
                <p className="text-sm text-on-surface-variant mb-6">
                  Are you sure you want to remove <strong>{staffToDelete.name}</strong>?
                </p>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6">
                  <p className="text-xs text-red-300 font-medium mb-2 uppercase tracking-widest">This action will:</p>
                  <ul className="text-sm text-red-200/80 space-y-2 list-disc pl-4">
                    <li>Cancel or reassign future appointments.</li>
                    <li>Remove the barber from customer booking.</li>
                    <li>Archive staff details.</li>
                  </ul>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => { setShowDeleteConfirmModal(false); setStaffToDelete(null); }}
                    className="px-4 py-2 border border-white/10 text-xs uppercase font-bold rounded-lg text-on-surface-variant hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-6 py-2 bg-red-500 text-white text-xs uppercase font-bold rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Remove Barber
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ==================================================== */}
      {/* 2. SERVICE MANAGEMENT VIEW */}
      {/* ==================================================== */}
      {activeView === 'services' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-headline text-on-surface">Salon Services</h2>
              <p className="text-xs text-on-surface-variant">Update prices, durations, or introduce new offerings.</p>
            </div>
            <button
              onClick={() => { setEditingServiceId(null); setServiceName(''); setServicePrice(''); setServiceDuration(''); setServiceDesc(''); setServiceCategory('Haircut'); setServiceStatus('Active'); setServiceImage(''); setImageFile(null); setImagePreview(''); setShowAddServiceModal(true); }}
              className="bg-primary text-on-primary text-xs uppercase tracking-wider font-bold py-3 px-6 rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/10 active:scale-95 transition-transform whitespace-nowrap"
            >
              <span className="material-symbols-outlined">add</span> Add Service
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Haircut', 'Beard Trim', 'Facial', 'Packages'].map(tab => (
              <button
                key={tab}
                onClick={() => setServiceFilterTab(tab)}
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                  serviceFilterTab === tab
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container border border-white/5 text-on-surface-variant hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.filter(ser => serviceFilterTab === 'All' || ser.category === serviceFilterTab).map(ser => (
              <div key={ser.id} className="glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col justify-between group hover:border-primary/30 transition-all">
                <div className="h-44 relative">
                  <img className="w-full h-full object-cover" src={ser.image} alt={ser.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button 
                      onClick={() => handleEditServiceClick(ser)}
                      className="p-2 bg-surface/90 hover:text-primary rounded-lg text-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button 
                      onClick={() => deleteService(ser.id)}
                      className="p-2 bg-surface/90 hover:text-red-400 rounded-lg text-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-headline text-lg text-on-surface">{ser.name}</h3>
                      <span className="font-bold text-primary font-headline">{formatCurrency(ser.price)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                        {ser.category}
                      </span>
                      {ser.status === 'Inactive' && (
                        <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">{ser.description}</p>
                  </div>
                  <div className="mt-6 border-t border-white/5 pt-3 flex items-center text-xs text-on-surface-variant gap-1">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>Duration: {ser.duration} mins</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Service Modal */}
          {showAddServiceModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="glass-panel p-8 rounded-2xl w-full max-w-md border border-white/10 relative" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-headline text-on-surface mb-6">
                  {editingServiceId ? 'Edit Service' : 'Add New Service'}
                </h3>
                <form onSubmit={handleAddService} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Image Input Selection */}
                  <div>
                    <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Service Image URL</label>
                    <input
                      type="text"
                      value={serviceImage}
                      onChange={(e) => {
                        setServiceImage(e.target.value);
                        setImagePreview(e.target.value);
                      }}
                      className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface mb-3"
                      placeholder="Paste image URL (e.g., https://images.unsplash.com/...)"
                    />
                    
                    <div className="flex items-center my-3">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="px-3 text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">OR UPLOAD FILE</span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <div 
                      className={`relative w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-colors cursor-pointer overflow-hidden ${
                        isDragging ? 'border-primary bg-primary/5' : imageError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 hover:border-white/30 bg-surface-container'
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleFileInputChange} 
                      />
                      {(imagePreview || serviceImage) ? (
                        <>
                          <img 
                            src={imagePreview || serviceImage} 
                            alt="Service Preview" 
                            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400'; }}
                          />
                          <div className="absolute inset-0 bg-background/40"></div>
                          <div className="relative z-10 flex flex-col items-center text-center">
                            <span className="material-symbols-outlined text-white text-3xl mb-1 shadow-sm">add_photo_alternate</span>
                            <span className="text-[10px] text-white/90 font-bold tracking-wide shadow-sm">Click or drop to replace image</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-center p-4">
                          <span className="material-symbols-outlined text-on-surface-variant/50 text-3xl mb-2">image</span>
                          <span className="text-[10px] text-on-surface-variant max-w-[200px]">Drop image here, or click to browse (JPEG, PNG, WEBP)</span>
                        </div>
                      )}
                    </div>
                    {imageError && <p className="text-red-400 text-[10px] mt-1.5">{imageError}</p>}
                  </div>

                  <div>
                    <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Service Name</label>
                    <input
                      type="text"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                      placeholder="e.g. Royal Hair Beard Package"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={servicePrice}
                        onChange={(e) => setServicePrice(e.target.value)}
                        className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                        placeholder="45.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Duration (mins)</label>
                      <input
                        type="number"
                        value={serviceDuration}
                        onChange={(e) => setServiceDuration(e.target.value)}
                        className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                        placeholder="45"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Category</label>
                      <select
                        value={serviceCategory}
                        onChange={(e) => setServiceCategory(e.target.value)}
                        className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                      >
                        <option value="Haircut">Haircut</option>
                        <option value="Beard Trim">Beard Trim</option>
                        <option value="Facial">Facial</option>
                        <option value="Packages">Packages</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Status</label>
                      <select
                        value={serviceStatus}
                        onChange={(e) => setServiceStatus(e.target.value)}
                        className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Description</label>
                    <textarea
                      value={serviceDesc}
                      onChange={(e) => setServiceDesc(e.target.value)}
                      rows="3"
                      className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                      placeholder="Provide a brief service outline..."
                      required
                    ></textarea>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddServiceModal(false)}
                      className="px-4 py-2 border border-white/10 text-xs uppercase font-bold rounded-lg text-on-surface-variant hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="px-6 py-2 bg-primary text-on-primary text-xs uppercase font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUploading && <span className="material-symbols-outlined animate-spin text-[16px]">refresh</span>}
                      {isUploading ? 'Saving...' : 'Save Service'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. CUSTOMER MANAGEMENT VIEW */}
      {/* ==================================================== */}
      {activeView === 'customers' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-headline text-on-surface">Registered Clients</h2>
            <p className="text-xs text-on-surface-variant">Monitor client listings and total grooming billing contributions.</p>
          </div>

          <div className="flex items-center gap-4 bg-surface-container px-4 py-3 rounded-xl border border-white/10 max-w-md">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              className="bg-transparent border-none text-sm text-on-surface focus:outline-none w-full"
              placeholder="Search clients by name or email..."
            />
          </div>

          <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-[10px] text-on-surface-variant uppercase tracking-widest">
                <tr>
                  <th className="px-unit-lg py-4 font-semibold">Client Name</th>
                  <th className="px-unit-lg py-4 font-semibold">Email</th>
                  <th className="px-unit-lg py-4 font-semibold">Appointments</th>
                  <th className="px-unit-lg py-4 font-semibold text-right">Total Revenue Contribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredClients.map(client => (
                  <tr key={client.email} className="hover:bg-white/5 transition-colors">
                    <td className="px-unit-lg py-4 text-on-surface font-semibold">{client.name}</td>
                    <td className="px-unit-lg py-4 text-on-surface-variant">{client.email}</td>
                    <td className="px-unit-lg py-4 text-on-surface-variant">{client.appointmentsCount} bookings</td>
                    <td className="px-unit-lg py-4 text-primary font-bold text-right">{formatCurrency(client.totalSpent)}</td>
                  </tr>
                ))}
                {filteredClients.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-unit-lg py-8 text-center text-on-surface-variant text-sm">No clients match search queries.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === 'appointments' && (() => {
        const completedCount = appointments.filter(a => a.status === 'Completed').length;
        const upcomingCount = appointments.filter(a => ['Pending', 'Confirmed', 'In Progress'].includes(a.status)).length;
        const cancelledCount = appointments.filter(a => ['Cancelled', 'Declined'].includes(a.status)).length;
        const totalRevenueVal = appointments.filter(a => a.status === 'Completed').reduce((acc, a) => acc + (a.price || 0), 0);

        return (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-3xl font-headline text-on-surface tracking-tight">Appointment History &amp; Master Board</h2>
                <p className="text-sm text-on-surface-variant mt-1">Review complete appointment history, track upcoming schedules, and manage status.</p>
              </div>
            </div>

            {/* KPI Summary Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface-container/60 p-5 rounded-2xl border border-white/10 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Total Appointments</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">event</span>
                </div>
                <p className="text-3xl font-headline font-bold text-on-surface">{appointments.length}</p>
                <p className="text-[10px] text-on-surface-variant/70 mt-2">All time salon bookings</p>
              </div>

              <div className="bg-surface-container/60 p-5 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">Completed (History)</span>
                  <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
                </div>
                <p className="text-3xl font-headline font-bold text-emerald-400">{completedCount}</p>
                <p className="text-[10px] text-emerald-400/80 mt-2 font-semibold">Earned {formatCurrency(totalRevenueVal)}</p>
              </div>

              <div className="bg-surface-container/60 p-5 rounded-2xl border border-primary/20 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-primary uppercase tracking-widest font-bold">Active &amp; Upcoming</span>
                  <span className="material-symbols-outlined text-primary text-[20px]">pending_actions</span>
                </div>
                <p className="text-3xl font-headline font-bold text-primary">{upcomingCount}</p>
                <p className="text-[10px] text-primary/70 mt-2">Pending, Confirmed or In-Progress</p>
              </div>

              <div className="bg-surface-container/60 p-5 rounded-2xl border border-red-500/20 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] text-red-400 uppercase tracking-widest font-bold">Cancelled / Declined</span>
                  <span className="material-symbols-outlined text-red-400 text-[20px]">cancel</span>
                </div>
                <p className="text-3xl font-headline font-bold text-red-400">{cancelledCount}</p>
                <p className="text-[10px] text-red-400/70 mt-2">Terminated schedules</p>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-surface-container/50 p-4 rounded-2xl border border-white/5 gap-4">
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                {[
                  { id: 'All', label: 'All History' },
                  { id: 'History', label: 'Completed History' },
                  { id: 'Upcoming', label: 'Upcoming & Active' },
                  { id: 'Pending', label: 'Pending Approval' },
                  { id: 'Cancelled', label: 'Cancelled / Declined' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setAptStatusFilter(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                      aptStatusFilter === tab.id
                        ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105'
                        : 'bg-white/5 text-on-surface-variant hover:text-on-surface hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-background px-4 py-2.5 rounded-xl border border-white/10 min-w-[280px]">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
                <input
                  type="text"
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                  className="bg-transparent border-none text-xs text-on-surface focus:outline-none w-full placeholder:text-on-surface-variant/50"
                  placeholder="Search client, service, stylist..."
                />
                {appointmentSearch && (
                  <button onClick={() => setAppointmentSearch('')} className="text-on-surface-variant hover:text-white">
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}
              </div>
            </div>

            {/* Master Appointments Table */}
            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] text-on-surface-variant uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="px-unit-lg py-4 font-bold">Client Details</th>
                    <th className="px-unit-lg py-4 font-bold">Service &amp; Price</th>
                    <th className="px-unit-lg py-4 font-bold">Scheduled Time</th>
                    <th className="px-unit-lg py-4 font-bold">Assigned Stylist</th>
                    <th className="px-unit-lg py-4 font-bold">Status</th>
                    <th className="px-unit-lg py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {filteredAppointments.map(apt => (
                    <tr key={apt.id || apt._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-unit-lg py-4">
                        <div 
                          onClick={() => handleSendWhatsAppNotification(apt)}
                          className="group/wa cursor-pointer hover:text-emerald-400 inline-flex items-center gap-1.5"
                          title="Click to notify client via WhatsApp"
                        >
                          <span className="text-on-surface font-semibold group-hover/wa:text-emerald-400 transition-colors">{apt.clientName || 'Valued Client'}</span>
                          <svg className="w-4 h-4 fill-emerald-500 hover:scale-110 transition-transform" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.277l-.76 2.769 2.834-.741c.943.596 1.937.946 3.125.95h.009c3.185 0 5.768-2.586 5.769-5.766 0-3.18-2.585-5.766-5.769-5.766zm3.435 8.167c-.15.422-.857.778-1.21.804-.35.027-.674.15-2.221-.49-1.802-.746-2.92-2.582-3.007-2.7-.09-.118-.737-.98-.737-1.87 0-.89.467-1.326.632-1.493.167-.167.363-.209.484-.209.122 0 .244.005.35.01.11.005.257-.042.403.313.15.367.514 1.258.558 1.347.045.09.075.195.015.314-.06.12-.09.195-.18.3-.09.105-.19.23-.27.315-.09.09-.18.188-.075.367.105.18.467.772.998 1.246.68.608 1.253.796 1.43.885.18.09.284.075.39-.047.105-.12.45-.525.57-.706.12-.18.24-.15.405-.09.165.06 1.05.495 1.23.585.18.09.3.135.346.21.045.075.045.435-.105.857z"/>
                            <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.83.496 3.59 1.388 5.138L2 22l4.987-1.308c1.51.826 3.203 1.312 4.986 1.312 5.556 0 10.03-4.48 10.03-10.004C22.003 6.48 17.522 2 12.004 2zm.006 18c-1.634 0-3.17-.442-4.505-1.217l-.323-.188-2.986.784.798-2.91-.207-.33C3.973 14.82 3.5 13.29 3.5 11.75 3.5 7.2 7.314 3.5 12.005 3.5c4.69 0 8.5 3.7 8.5 8.25s-3.81 8.25-8.5 8.25z"/>
                          </svg>
                        </div>
                        <p 
                          onClick={() => handleSendWhatsAppNotification(apt)}
                          className="text-[10px] text-on-surface-variant cursor-pointer hover:text-emerald-400 transition-colors w-fit"
                          title="Click to notify client via WhatsApp"
                        >
                          {apt.clientEmail}
                        </p>
                        {apt.notes && (
                          <p className="text-[11px] text-primary/80 mt-1 italic max-w-xs truncate" title={apt.notes}>
                            "{apt.notes}"
                          </p>
                        )}
                      </td>

                      <td className="px-unit-lg py-4">
                        <span className="font-semibold text-on-surface block">{apt.serviceName}</span>
                        <span className="text-xs font-bold text-primary">{formatCurrency(apt.price)}</span>
                      </td>

                      <td className="px-unit-lg py-4 text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-primary">event</span>
                          <span className="text-xs font-semibold">{apt.date}</span>
                        </div>
                        <span className="text-[11px] text-on-surface-variant/80 block mt-0.5">{apt.time}</span>
                      </td>

                      <td className="px-unit-lg py-4 text-on-surface-variant">
                        <div 
                          onClick={() => handleSendStaffWhatsAppNotification(apt)}
                          className="group/wa cursor-pointer hover:text-emerald-400 inline-flex items-center gap-1.5"
                          title="Click to notify stylist via WhatsApp"
                        >
                          <span className="group-hover/wa:text-emerald-400 transition-colors font-medium">{apt.barberName}</span>
                          <svg className="w-4 h-4 fill-emerald-500 hover:scale-110 transition-transform" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.277l-.76 2.769 2.834-.741c.943.596 1.937.946 3.125.95h.009c3.185 0 5.768-2.586 5.769-5.766 0-3.18-2.585-5.766-5.769-5.766zm3.435 8.167c-.15.422-.857.778-1.21.804-.35.027-.674.15-2.221-.49-1.802-.746-2.92-2.582-3.007-2.7-.09-.118-.737-.98-.737-1.87 0-.89.467-1.326.632-1.493.167-.167.363-.209.484-.209.122 0 .244.005.35.01.11.005.257-.042.403.313.15.367.514 1.258.558 1.347.045.09.075.195.015.314-.06.12-.09.195-.18.3-.09.105-.19.23-.27.315-.09.09-.18.188-.075.367.105.18.467.772.998 1.246.68.608 1.253.796 1.43.885.18.09.284.075.39-.047.105-.12.45-.525.57-.706.12-.18.24-.15.405-.09.165.06 1.05.495 1.23.585.18.09.3.135.346.21.045.075.045.435-.105.857z"/>
                            <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.83.496 3.59 1.388 5.138L2 22l4.987-1.308c1.51.826 3.203 1.312 4.986 1.312 5.556 0 10.03-4.48 10.03-10.004C22.003 6.48 17.522 2 12.004 2zm.006 18c-1.634 0-3.17-.442-4.505-1.217l-.323-.188-2.986.784.798-2.91-.207-.33C3.973 14.82 3.5 13.29 3.5 11.75 3.5 7.2 7.314 3.5 12.005 3.5c4.69 0 8.5 3.7 8.5 8.25s-3.81 8.25-8.5 8.25z"/>
                          </svg>
                        </div>
                      </td>

                      <td className="px-unit-lg py-4">
                        <span className={`inline-block whitespace-nowrap text-center min-w-[90px] px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          apt.status === 'Completed'
                            ? 'bg-green-950/20 text-green-400 border border-green-500/30'
                            : apt.status === 'Confirmed'
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : apt.status === 'In Progress'
                            ? 'bg-blue-950/20 text-blue-400 border border-blue-500/30'
                            : apt.status === 'Cancelled'
                            ? 'bg-red-950/20 text-red-400 border border-red-500/30'
                            : apt.status === 'Pending'
                            ? 'bg-amber-950/20 text-amber-400 border border-amber-500/30'
                            : apt.status === 'Declined'
                            ? 'bg-red-950/20 text-red-500 border border-red-500/30'
                            : 'bg-white/10 text-on-surface-variant'
                        }`}>
                          {apt.status}
                        </span>
                      </td>

                      <td className="px-unit-lg py-4 text-right">
                        {apt.status === 'Pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => confirmBooking(apt._id || apt.id)}
                              className="w-20 bg-green-950/20 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white text-[10px] font-bold uppercase py-1.5 rounded cursor-pointer transition-all"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleDeclineClick(apt._id || apt.id)}
                              className="w-20 bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-[10px] font-bold uppercase py-1.5 rounded cursor-pointer transition-all"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                        {apt.status === 'Confirmed' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => updateAppointmentStatus(apt._id || apt.id, 'In Progress')}
                              className="w-20 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-on-primary text-[10px] font-bold uppercase py-1.5 rounded cursor-pointer transition-all"
                            >
                              Start
                            </button>
                            <button
                              onClick={() => updateAppointmentStatus(apt._id || apt.id, 'Cancelled')}
                              className="w-20 bg-red-950/20 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-[10px] font-bold uppercase py-1.5 rounded cursor-pointer transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {apt.status === 'In Progress' && (
                          <div className="flex items-center justify-end">
                            <button
                              onClick={() => updateAppointmentStatus(apt._id || apt.id, 'Completed')}
                              className="w-20 bg-green-950/20 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white text-[10px] font-bold uppercase py-1.5 rounded cursor-pointer transition-all"
                            >
                              Complete
                            </button>
                          </div>
                        )}
                        {apt.status === 'Completed' && (
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-end gap-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span> Archived
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-unit-lg py-12 text-center text-on-surface-variant text-sm">
                        <div className="flex flex-col items-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">event_busy</span>
                          <p className="font-semibold text-on-surface">No appointment history records found.</p>
                          <p className="text-xs text-on-surface-variant/60">Try clearing your search query or selecting a different filter tab.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ==================================================== */}
      {/* 4.5. REPORTS & INVOICES VIEW */}
      {/* ==================================================== */}
      {activeView === 'reports' && (() => {
        const completedApts = appointments.filter(a => a.status === 'Completed');
        const totalEarningsVal = completedApts.reduce((sum, a) => sum + (a.price || 0), 0);
        
        const todayStr = new Date().toISOString().split('T')[0];
        const todayApts = completedApts.filter(a => a.date && a.date.startsWith(todayStr));
        const todayRevenueVal = todayApts.reduce((sum, a) => sum + (a.price || 0), 0);

        const currentMonthStr = todayStr.substring(0, 7);
        const monthlyApts = completedApts.filter(a => a.date && a.date.startsWith(currentMonthStr));
        const monthlyRevenueVal = monthlyApts.reduce((sum, a) => sum + (a.price || 0), 0);

        const gstCollectedVal = completedApts.reduce((sum, a) => {
          const totalVal = a.price || 0;
          const sub = totalVal / 1.18;
          return sum + (totalVal - sub);
        }, 0);

        const invoices = completedApts.map((apt, idx) => {
          const totalVal = apt.price || 0;
          const sub = Math.round(totalVal / 1.18);
          const gstVal = totalVal - sub;
          const aptIdStr = apt._id || apt.id || String(idx + 1);
          const invId = `INV-${aptIdStr.substring(Math.max(0, aptIdStr.length - 4)).toUpperCase()}`;

          return {
            id: invId,
            client: apt.clientName || 'Walk-in Client',
            subtotal: sub,
            gst: gstVal,
            discount: 0,
            total: totalVal,
            paid: totalVal,
            balance: 0,
            method: 'Online Payment',
            date: apt.date || 'N/A'
          };
        });

        const handleExportExcel = () => {
          if (invoices.length === 0) {
            toast.error('No invoices available to export.');
            return;
          }
          const headers = ['Invoice ID', 'Date', 'Client', 'Subtotal (INR)', 'GST (18%) (INR)', 'Discount (INR)', 'Grand Total (INR)', 'Paid (INR)', 'Balance (INR)', 'Payment Method'];
          const rows = invoices.map(inv => [
            inv.id,
            inv.date,
            inv.client,
            inv.subtotal,
            inv.gst,
            inv.discount,
            inv.total,
            inv.paid,
            inv.balance,
            inv.method
          ]);
          const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `sales_report_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.success('Excel report downloaded successfully!');
        };

        const handleExportPDF = () => {
          const element = document.getElementById('invoices-report-container');
          if (!element) {
            toast.error('Invoice report view not found.');
            return;
          }
          toast.info('Generating PDF report...');
          const opt = {
            margin:       10,
            filename:     `sales_report_${new Date().toISOString().split('T')[0]}.pdf`,
            image:        { type: 'jpeg', quality: 0.95 },
            html2canvas:  { scale: 1.2, useCORS: true, backgroundColor: '#121414' },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
          };
          html2pdf().from(element).set(opt).save()
            .then(() => toast.success('PDF report downloaded successfully!'))
            .catch((err) => {
              console.error(err);
              toast.error('Failed to generate PDF: ' + (err.message || err.toString()));
            });
        };

        return (
          <div id="invoices-report-container" className="space-y-8 pb-20">
            <div>
              <h2 className="text-2xl font-headline text-on-surface">Revenue Reports & Invoices</h2>
              <p className="text-xs text-on-surface-variant">Analyze sales performance, payments, and billing details.</p>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-primary/30 transition-all">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Today's Revenue</span>
                <h3 className="text-2xl font-headline font-bold text-primary mt-2">{formatCurrency(todayRevenueVal)}</h3>
                <span className="text-[9px] text-green-400 mt-1">↑ Real-time updates</span>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-primary/30 transition-all">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Monthly Revenue</span>
                <h3 className="text-2xl font-headline font-bold text-on-surface mt-2">{formatCurrency(monthlyRevenueVal)}</h3>
                <span className="text-[9px] text-green-400 mt-1">↑ This calendar month</span>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-primary/30 transition-all">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Total Earnings</span>
                <h3 className="text-2xl font-headline font-bold text-on-surface mt-2">{formatCurrency(totalEarningsVal)}</h3>
                <span className="text-[9px] text-on-surface-variant mt-1">All-time record</span>
              </div>
              <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-primary/30 transition-all">
                <span className="text-[10px] text-on-surface-variant uppercase font-semibold">GST Collected (18%)</span>
                <h3 className="text-2xl font-headline font-bold text-on-surface mt-2">{formatCurrency(gstCollectedVal)}</h3>
                <span className="text-[9px] text-on-surface-variant mt-1">Liability ledger</span>
              </div>
            </div>

            {/* Invoices List */}
            <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <div>
                  <h4 className="text-lg font-headline text-on-surface">Invoice Reports</h4>
                  <p className="text-xs text-on-surface-variant">Review subtotals, tax logs, and customer balances.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleExportExcel}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-on-surface hover:border-primary/50 text-[10px] uppercase font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Export Excel
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="px-4 py-2 bg-primary text-on-primary text-[10px] uppercase font-bold rounded-lg cursor-pointer"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] text-on-surface-variant uppercase tracking-widest">
                  <tr>
                    <th className="px-unit-lg py-4 font-semibold">Invoice ID</th>
                    <th className="px-unit-lg py-4 font-semibold">Date</th>
                    <th className="px-unit-lg py-4 font-semibold">Client</th>
                    <th className="px-unit-lg py-4 font-semibold">Subtotal</th>
                    <th className="px-unit-lg py-4 font-semibold">GST (18%)</th>
                    <th className="px-unit-lg py-4 font-semibold">Discount</th>
                    <th className="px-unit-lg py-4 font-semibold">Grand Total</th>
                    <th className="px-unit-lg py-4 font-semibold">Paid</th>
                    <th className="px-unit-lg py-4 font-semibold">Balance</th>
                    <th className="px-unit-lg py-4 font-semibold">Method</th>
                    <th className="px-unit-lg py-4 font-semibold text-right">Invoice Sheet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="px-unit-lg py-8 text-center text-on-surface-variant font-medium">
                        No completed appointments found. Completed bookings will generate real invoices and revenue metrics.
                      </td>
                    </tr>
                  ) : (
                    invoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-unit-lg py-4 font-semibold text-primary">{inv.id}</td>
                        <td className="px-unit-lg py-4 text-on-surface-variant">{inv.date}</td>
                        <td className="px-unit-lg py-4 text-on-surface font-semibold">{inv.client}</td>
                        <td className="px-unit-lg py-4 text-on-surface-variant">{formatCurrency(inv.subtotal)}</td>
                        <td className="px-unit-lg py-4 text-on-surface-variant">{formatCurrency(inv.gst)}</td>
                        <td className="px-unit-lg py-4 text-on-surface-variant">-{formatCurrency(inv.discount)}</td>
                        <td className="px-unit-lg py-4 text-on-surface font-bold">{formatCurrency(inv.total)}</td>
                        <td className="px-unit-lg py-4 text-green-400 font-bold">{formatCurrency(inv.paid)}</td>
                        <td className="px-unit-lg py-4 text-on-surface-variant">{formatCurrency(inv.balance)}</td>
                        <td className="px-unit-lg py-4 text-on-surface-variant">{inv.method}</td>
                        <td className="px-unit-lg py-4 text-right">
                          <button
                            onClick={() => alert(`
  ------------------------------------
             LUXE GROOM STUDIO
  ------------------------------------
  Invoice ID: ${inv.id}
  Client: ${inv.client}
  Date: ${inv.date}
  Payment Method: ${inv.method}
  ------------------------------------
  Subtotal       : ${formatCurrency(inv.subtotal)}
  GST (18%)      : ${formatCurrency(inv.gst)}
  Discount       : -${formatCurrency(inv.discount)}
  ------------------------------------
  Grand Total    : ${formatCurrency(inv.total)}
  Amount Paid    : ${formatCurrency(inv.paid)}
  Balance        : ${formatCurrency(inv.balance)}
  ------------------------------------
            Thank you for visiting!
  `)}
                            className="bg-primary/10 border border-primary/20 hover:bg-primary text-primary hover:text-on-primary text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded transition-colors"
                          >
                            View Bill
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Payment breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-2xl">
                <h4 className="text-lg font-headline text-on-surface mb-4">Payment Methods Volume</h4>
                <div className="space-y-4">
                  {[
                    { method: 'UPI (Paytm/Google Pay/PhonePe)', percentage: '65%', amount: totalEarningsVal * 0.65 },
                    { method: 'Credit/Debit Cards', percentage: '25%', amount: totalEarningsVal * 0.25 },
                    { method: 'Net Banking', percentage: '7%', amount: totalEarningsVal * 0.07 },
                    { method: 'Cash', percentage: '3%', amount: totalEarningsVal * 0.03 }
                  ].map(pm => (
                    <div key={pm.method} className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-on-surface-variant">{pm.method}</span>
                        <span className="text-on-surface">{pm.percentage} ({formatCurrency(pm.amount)})</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: pm.percentage }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-headline text-on-surface mb-2">Export Sales Report</h4>
                  <p className="text-xs text-on-surface-variant">Download consolidated reports containing booking transactions and earnings breakdown in INR format.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button
                    onClick={handleExportExcel}
                    className="p-4 rounded-xl border border-white/10 hover:border-primary/50 bg-white/5 hover:bg-primary/5 text-xs font-bold uppercase tracking-wider text-primary text-center flex flex-col items-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-2xl">table_chart</span>
                    Excel Spreadsheet
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="p-4 rounded-xl border border-white/10 hover:border-primary/50 bg-white/5 hover:bg-primary/5 text-xs font-bold uppercase tracking-wider text-primary text-center flex flex-col items-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                    PDF Document
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================================================== */}
      {/* 5. SETTINGS VIEW */}
      {/* ==================================================== */}
      {activeView === 'settings' && (
        <div className="glass-panel p-6 rounded-2xl max-w-2xl">
          <h3 className="text-xl font-headline text-on-surface mb-6">Salon Settings</h3>
          <form className="space-y-6" onSubmit={handleSaveSettings}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Opening Time</label>
                <input
                  type="text"
                  value={salonSettings.openingTime || ''}
                  onChange={(e) => setSalonSettings({ ...salonSettings, openingTime: e.target.value })}
                  placeholder="e.g. 09:00 AM"
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Closing Time</label>
                <input
                  type="text"
                  value={salonSettings.closingTime || ''}
                  onChange={(e) => setSalonSettings({ ...salonSettings, closingTime: e.target.value })}
                  placeholder="e.g. 09:00 PM"
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Slot Interval (Minutes)</label>
                <select
                  value={salonSettings.slotInterval || 30}
                  onChange={(e) => setSalonSettings({ ...salonSettings, slotInterval: Number(e.target.value) })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>60 Minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Max Bookings Per Slot</label>
                <input
                  type="number"
                  min={1}
                  value={salonSettings.maxBookingsPerSlot || 1}
                  onChange={(e) => setSalonSettings({ ...salonSettings, maxBookingsPerSlot: Number(e.target.value) })}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Break Start (Lunch)</label>
                <input
                  type="text"
                  value={salonSettings.breakStart || ''}
                  onChange={(e) => setSalonSettings({ ...salonSettings, breakStart: e.target.value })}
                  placeholder="e.g. 01:00 PM"
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Break End (Lunch)</label>
                <input
                  type="text"
                  value={salonSettings.breakEnd || ''}
                  onChange={(e) => setSalonSettings({ ...salonSettings, breakEnd: e.target.value })}
                  placeholder="e.g. 02:00 PM"
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Holidays & Blocked Dates (Comma separated YYYY-MM-DD)</label>
              <textarea
                rows={3}
                value={salonSettings.holidays ? salonSettings.holidays.join(', ') : ''}
                onChange={(e) => {
                  const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                  setSalonSettings({ ...salonSettings, holidays: list });
                }}
                placeholder="e.g. 2026-08-15, 2026-12-25"
                className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-primary text-on-primary rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all cursor-pointer"
            >
              Save Salon Parameters
            </button>
          </form>
        </div>
      )}

      {/* Decline Reason Modal */}
      {declineOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md border border-white/10 relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-headline text-on-surface mb-2">Decline Booking Request</h3>
            <p className="text-xs text-on-surface-variant mb-6 font-body">
              Provide an optional explanation message for the client.
            </p>
            <form onSubmit={handleDeclineSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">
                  Decline Reason (Optional)
                </label>
                <textarea
                  rows={3}
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary text-on-surface font-body"
                  placeholder="e.g. The stylist is currently overbooked at this time slot."
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setDeclineOpen(false)}
                  className="px-4 py-2 border border-white/10 text-xs uppercase font-bold rounded-lg text-on-surface-variant hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white text-xs uppercase font-bold rounded-lg cursor-pointer hover:bg-red-700"
                >
                  Decline Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Management;

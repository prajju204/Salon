import React, { useState, useEffect } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { useApp } from '@/shared/context/AppContext';
import axios from 'axios';
import { formatCurrency } from '@/shared/utils/format';
import { API_URL } from '@/shared/utils/api';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';

const StaffDashboard = () => {
  const { user } = useAuth();
  const { refreshData } = useApp();
  const { tab } = useParams();
  const activeTab = tab || 'appointments';

  // Appointments
  const [myAppointments, setMyAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Clinical treatments
  const [clinicalTreatments, setClinicalTreatments] = useState([]);
  const [loadingClinical, setLoadingClinical] = useState(false);

  // Prescriptions list
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  // Treatment payments list
  const [treatmentPayments, setTreatmentPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Notes form state
  const [selectedTreatmentId, setSelectedTreatmentId] = useState('');
  const [notesForm, setNotesForm] = useState({ notes: '', diagnosis: '', nextSessionDate: '', sessionNumber: '', totalSessions: '' });
  const [savingNotes, setSavingNotes] = useState(false);

  // Prescription form state
  const [rxTreatmentId, setRxTreatmentId] = useState('');
  const [rxForm, setRxForm] = useState({ instructions: '', followUpDate: '', dosageDetails: '' });
  const [rxMedicines, setRxMedicines] = useState([{ name: '', dose: '', frequency: '' }]);
  const [savingRx, setSavingRx] = useState(false);

  // Payment form state
  const [payTreatmentId, setPayTreatmentId] = useState('');
  const [payForm, setPayForm] = useState({ paymentStatus: 'Pending', amountReceived: '', paymentMode: 'Cash', remarks: '' });
  const [savingPay, setSavingPay] = useState(false);

  // Leaves
  const [leaves, setLeaves] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loadingLeave, setLoadingLeave] = useState(false);

  // Salary
  const [salaryData, setSalaryData] = useState({ salary: 0, revenue: 0, paidAmount: 0, payouts: [] });
  const [upiId, setUpiId] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Profile & Password
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    mobileNumber: user?.mobileNumber || ''
  });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    refreshData();
    fetchAppointments();
    fetchLeaves();
    fetchSalary();
  }, []);

  useEffect(() => {
    if (activeTab === 'clinical-treatments' || activeTab === 'treatment-history') {
      fetchClinicalTreatments();
    }
    if (activeTab === 'prescriptions') fetchPrescriptions();
    if (activeTab === 'treatment-payments') fetchTreatmentPayments();
  }, [activeTab]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('luxe_admin_token') || localStorage.getItem('luxe_user_token') || localStorage.getItem('luxe_token');
    return token ? { Authorization: `Bearer ${token}` } : (axios.defaults.headers.common['Authorization'] ? { Authorization: axios.defaults.headers.common['Authorization'] } : {});
  };

  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const res = await axios.get(`${API_URL}/staff/appointments`, { headers: getAuthHeader() });
      if (res.data.success) setMyAppointments(res.data.data);
    } catch (err) { console.error('Failed to fetch appointments:', err); }
    finally { setLoadingAppointments(false); }
  };

  const fetchClinicalTreatments = async () => {
    setLoadingClinical(true);
    try {
      const res = await axios.get(`${API_URL}/staff/clinical-treatments`, { headers: getAuthHeader() });
      if (res.data.success) setClinicalTreatments(res.data.data);
      else setClinicalTreatments(myAppointments); // fallback
    } catch { setClinicalTreatments(myAppointments); }
    finally { setLoadingClinical(false); }
  };

  const fetchPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      const res = await axios.get(`${API_URL}/staff/prescriptions`, { headers: getAuthHeader() });
      if (res.data.success) setPrescriptions(res.data.data);
    } catch { }
    finally { setLoadingPrescriptions(false); }
  };

  const fetchTreatmentPayments = async () => {
    setLoadingPayments(true);
    try {
      const res = await axios.get(`${API_URL}/staff/treatment-payments`, { headers: getAuthHeader() });
      if (res.data.success) setTreatmentPayments(res.data.data);
    } catch { }
    finally { setLoadingPayments(false); }
  };

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(`${API_URL}/staff/leave`, { headers: getAuthHeader() });
      if (res.data.success) setLeaves(res.data.data);
    } catch (err) { console.error('Failed to fetch leaves:', err); }
  };

  const fetchSalary = async () => {
    try {
      const res = await axios.get(`${API_URL}/staff/salary`, { headers: getAuthHeader() });
      if (res.data.success) {
        setSalaryData(res.data.data);
        setUpiId(res.data.data.upiId || '');
        setBankAccountNumber(res.data.data.bankAccountNumber || '');
      }
    } catch (err) { console.error('Failed to fetch salary:', err); }
  };

  const submitPaymentDetails = async (e) => {
    e.preventDefault();
    setIsSavingPayment(true);
    try {
      const res = await axios.put(`${API_URL}/staff/payment-details`, { upiId, bankAccountNumber }, { headers: getAuthHeader() });
      if (res.data.success) { toast.success('Payment details updated successfully'); fetchSalary(); }
    } catch { toast.error('Failed to update payment details'); }
    finally { setIsSavingPayment(false); }
  };

  const submitLeave = async (e) => {
    e.preventDefault();
    setLoadingLeave(true);
    try {
      await axios.post(`${API_URL}/staff/leave`, { startDate, endDate, reason }, { headers: getAuthHeader() });
      toast.success('Leave requested successfully');
      setStartDate(''); setEndDate(''); setReason('');
      fetchLeaves();
    } catch { toast.error('Failed to request leave'); }
    finally { setLoadingLeave(false); }
  };

  const submitProfileUpdate = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const res = await axios.put(`${API_URL}/staff/profile`, profileData, { headers: getAuthHeader() });
      if (res.data.success) toast.success('Profile updated successfully');
    } catch { toast.error('Failed to update profile'); }
    finally { setUpdatingProfile(false); }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) return toast.error('New passwords do not match');
    setChangingPassword(true);
    try {
      const res = await axios.put(`${API_URL}/staff/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, { headers: getAuthHeader() });
      if (res.data.success) { toast.success('Password changed successfully'); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    finally { setChangingPassword(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(`${API_URL}/staff/appointments/${id}/status`, { status }, { headers: getAuthHeader() });
      if (res.data.success) { toast.success(`Appointment marked as ${status}`); fetchAppointments(); fetchSalary(); }
    } catch { toast.error('Failed to update status'); }
  };

  // Clinical: save treatment notes
  const saveTreatmentNotes = async (e) => {
    e.preventDefault();
    if (!selectedTreatmentId) return toast.error('Please select a treatment');
    setSavingNotes(true);
    try {
      const res = await axios.put(`${API_URL}/staff/appointments/${selectedTreatmentId}/treatment-notes`, notesForm, { headers: getAuthHeader() });
      if (res.data.success) {
        toast.success('Treatment notes saved');
        // Refresh both lists so Recent Notes panel updates immediately
        await fetchAppointments();
        fetchClinicalTreatments();
      }
    } catch { toast.error('Failed to save notes'); }
    finally { setSavingNotes(false); }
  };

  // Clinical: save prescription
  const savePrescription = async (e) => {
    e.preventDefault();
    if (!rxTreatmentId) return toast.error('Please select a treatment');
    setSavingRx(true);
    try {
      const payload = { ...rxForm, medicines: rxMedicines.filter(m => m.name.trim()) };
      const res = await axios.put(`${API_URL}/staff/appointments/${rxTreatmentId}/prescription`, payload, { headers: getAuthHeader() });
      if (res.data.success) { toast.success('Prescription saved & visible to patient'); fetchPrescriptions(); }
    } catch { toast.error('Failed to save prescription'); }
    finally { setSavingRx(false); }
  };

  // Clinical: save payment
  const saveTreatmentPayment = async (e) => {
    e.preventDefault();
    if (!payTreatmentId) return toast.error('Please select a treatment');
    setSavingPay(true);
    try {
      const res = await axios.put(`${API_URL}/staff/appointments/${payTreatmentId}/treatment-payment`, payForm, { headers: getAuthHeader() });
      if (res.data.success) { toast.success('Payment recorded'); fetchTreatmentPayments(); }
    } catch { toast.error('Failed to record payment'); }
    finally { setSavingPay(false); }
  };

  const addMedicine = () => setRxMedicines(prev => [...prev, { name: '', dose: '', frequency: '' }]);
  const updateMedicine = (i, field, val) => setRxMedicines(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  const removeMedicine = (i) => setRxMedicines(prev => prev.filter((_, idx) => idx !== i));

  const inputCls = 'w-full bg-background border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface';
  const labelCls = 'block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2';

  return (
    <div className="pt-28 px-4 md:px-8 max-w-[1600px] mx-auto font-body pb-32">
      <div className="mb-8">
        <h2 className="text-3xl font-headline text-on-surface tracking-tight">Welcome, {user?.name}</h2>
        <p className="text-sm text-on-surface-variant mt-1">Staff Portal — Manage your schedule and details.</p>
      </div>

      {/* ── APPOINTMENTS ── */}
      {activeTab === 'appointments' && (
        <div className="space-y-6">
          <h3 className="text-xl font-headline text-on-surface">Your Appointments</h3>
          {loadingAppointments ? (
            <p className="text-on-surface-variant">Loading appointments...</p>
          ) : myAppointments.length === 0 ? (
            <p className="text-on-surface-variant">No appointments assigned to you yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myAppointments.map(apt => (
                <div key={apt.id || apt._id} className="bg-surface-container rounded-2xl p-6 border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-headline text-lg text-on-surface">{apt.serviceName}</h4>
                      <p className="text-sm text-on-surface-variant">{apt.date} at {apt.time}</p>
                    </div>
                    <select
                      value={apt.status}
                      onChange={(e) => updateStatus(apt.id || apt._id, e.target.value)}
                      className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider outline-none ${
                        apt.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        apt.status === 'Cancelled' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      <option value="Pending" className="bg-surface-container text-white">Pending</option>
                      <option value="Confirmed" className="bg-surface-container text-white">Confirmed</option>
                      <option value="In Progress" className="bg-surface-container text-white">In Progress</option>
                      <option value="Completed" className="bg-surface-container text-white">Completed</option>
                    </select>
                  </div>
                  <div className="text-sm text-on-surface-variant">
                    <p><strong className="text-on-surface">Client:</strong> {apt.clientName}</p>
                    <p><strong className="text-on-surface">Price:</strong> {formatCurrency(apt.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LEAVE ── */}
      {activeTab === 'leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-headline text-on-surface mb-6">Request Leave</h3>
            <form onSubmit={submitLeave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Start Date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>End Date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Reason</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows="3" className={inputCls}></textarea>
              </div>
              <button type="submit" disabled={loadingLeave} className="w-full bg-primary text-on-primary font-bold uppercase text-xs py-3 rounded-lg hover:bg-primary/90 transition-colors">
                {loadingLeave ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
          <div>
            <h3 className="text-xl font-headline text-on-surface mb-6">Leave History</h3>
            {leaves.length === 0 ? <p className="text-on-surface-variant">No leave requests found.</p> : (
              <div className="space-y-4">
                {leaves.map(l => (
                  <div key={l._id} className="bg-surface-container rounded-xl p-4 border border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}</p>
                      <p className="text-xs text-on-surface-variant mt-1">{l.reason}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${l.status === 'Approved' ? 'text-emerald-400 bg-emerald-500/10' : l.status === 'Rejected' ? 'text-red-400 bg-red-500/10' : 'text-yellow-400 bg-yellow-500/10'}`}>{l.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SALARY (Commented Out) ── */}
      {/* {activeTab === 'salary' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h3 className="text-xl font-headline text-on-surface mb-6">Salary & Earnings Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Base Salary', val: salaryData.salary, cls: '' },
                  { label: 'Total Revenue', val: salaryData.revenue, cls: '' },
                  { label: 'Total Paid', val: salaryData.paidAmount || 0, cls: 'text-green-400 font-bold' },
                  { label: 'Pending Balance', val: Math.max(0, (salaryData.salary || 0) + (salaryData.revenue || 0) - (salaryData.paidAmount || 0)), cls: 'text-primary font-bold' },
                ].map(s => (
                  <div key={s.label} className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">{s.label}</p>
                    <p className={`text-xl font-headline text-on-surface ${s.cls}`}>{formatCurrency(s.val)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
              <h3 className="text-lg font-headline text-on-surface mb-4">Salary Payout History</h3>
              {(!salaryData.payouts || salaryData.payouts.length === 0) ? (
                <p className="text-xs text-on-surface-variant">No payouts processed yet by the administrator.</p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-[9px] text-on-surface-variant uppercase tracking-widest">
                    <tr><th className="px-4 py-2 font-semibold">Date</th><th className="px-4 py-2 font-semibold">Amount</th><th className="px-4 py-2 font-semibold text-right">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {salaryData.payouts.map((p, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-on-surface-variant">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-semibold text-on-surface">{formatCurrency(p.amount)}</td>
                        <td className="px-4 py-3 text-right"><span className="px-2 py-0.5 rounded bg-green-950/20 border border-green-500/30 text-green-400 font-bold uppercase text-[9px]">Paid</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/10 h-fit">
            <h3 className="text-xl font-headline text-on-surface mb-2">Payment Details</h3>
            <p className="text-xs text-on-surface-variant mb-6">Enter your UPI ID or bank details for payouts.</p>
            <form onSubmit={submitPaymentDetails} className="space-y-4">
              <div>
                <label className={labelCls}>UPI ID</label>
                <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className={inputCls} placeholder="e.g. name@upi" />
              </div>
              <div className="flex items-center my-3"><div className="flex-1 h-px bg-white/10" /><span className="px-3 text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">OR</span><div className="flex-1 h-px bg-white/10" /></div>
              <div>
                <label className={labelCls}>Bank Account / IFSC</label>
                <textarea rows="2" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} className={inputCls} placeholder="e.g. Account: 1234567890, IFSC: HDFC0001234" />
              </div>
              <button type="submit" disabled={isSavingPayment} className="w-full bg-primary text-on-primary font-bold uppercase text-xs py-3 rounded-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                {isSavingPayment ? 'Saving...' : 'Save Payment Info'}
              </button>
            </form>
          </div>
        </div>
      )} */}

      {/* ── PROFILE ── */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-headline text-on-surface mb-6">Update Profile</h3>
            <form onSubmit={submitProfileUpdate} className="space-y-4">
              {[['Name', 'name', 'text'], ['Username', 'username', 'text'], ['Email', 'email', 'email'], ['Mobile Number', 'mobileNumber', 'text']].map(([l, k, t]) => (
                <div key={k}>
                  <label className={labelCls}>{l}</label>
                  <input type={t} value={profileData[k]} onChange={(e) => setProfileData({ ...profileData, [k]: e.target.value })} required={k === 'name' || k === 'email'} className={inputCls} />
                </div>
              ))}
              <button type="submit" disabled={updatingProfile} className="w-full bg-primary text-on-primary font-bold uppercase text-xs py-3 rounded-lg hover:bg-primary/90 transition-colors">
                {updatingProfile ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-xl font-headline text-on-surface mb-6">Change Password</h3>
            <form onSubmit={submitPasswordChange} className="space-y-4">
              {[['Current Password', 'currentPassword'], ['New Password', 'newPassword'], ['Confirm New Password', 'confirmPassword']].map(([l, k]) => (
                <div key={k}>
                  <label className={labelCls}>{l}</label>
                  <input type="password" value={passwordData[k]} onChange={(e) => setPasswordData({ ...passwordData, [k]: e.target.value })} required className={inputCls} />
                </div>
              ))}
              <button type="submit" disabled={changingPassword} className="w-full bg-primary text-on-primary font-bold uppercase text-xs py-3 rounded-lg hover:bg-primary/90 transition-colors">
                {changingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── CLINICAL TREATMENTS (COMMENTED OUT) ── */}
      {/* {activeTab === 'clinical-treatments' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-amber-400">medical_services</span>
            <h3 className="text-xl font-headline text-on-surface">Clinical Treatments</h3>
          </div>
          <p className="text-sm text-on-surface-variant mb-6">View and manage all your assigned clinical patient sessions.</p>

          {loadingClinical ? (
            <div className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined animate-spin text-primary">progress_activity</span> Loading treatments...</div>
          ) : clinicalTreatments.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl border border-white/5 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant/20 block mb-3">biotech</span>
              <p className="text-on-surface-variant text-sm">No clinical treatments assigned to you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clinicalTreatments.map(t => (
                <div key={t._id || t.id} className="bg-surface-container rounded-2xl p-5 border border-white/5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-headline text-base text-on-surface">{t.serviceName}</h4>
                      <p className="text-xs text-on-surface-variant">{t.clientName || t.clientEmail} · {t.date} {t.time && `at ${t.time}`}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${t.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400' : t.status === 'In Progress' ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>{t.status}</span>
                  </div>
                  <div className="flex gap-3 text-[10px] text-on-surface-variant/70 font-mono">
                    {t.treatmentNotes && <span className="text-amber-400">📝 Notes</span>}
                    {t.prescription?.issuedAt && <span className="text-blue-400">💊 Rx</span>}
                    {t.treatmentPayment && <span className="text-emerald-400">💳 Payment</span>}
                  </div>
                  {t.treatmentNotes && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 text-xs text-on-surface-variant">{t.treatmentNotes}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )} */}

      {/* ── TREATMENT HISTORY ── */}
      {activeTab === 'treatment-history' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-400">history</span>
            <h3 className="text-xl font-headline text-on-surface">Treatment History</h3>
          </div>
          {loadingClinical ? (
            <p className="text-on-surface-variant">Loading...</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/5">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-container text-[9px] text-on-surface-variant uppercase tracking-widest">
                  <tr>
                    {['Patient', 'Service', 'Date', 'Status', 'Notes', 'Rx', 'Payment'].map(h => (
                      <th key={h} className="px-4 py-3 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[...myAppointments, ...clinicalTreatments].filter((v, i, a) => a.findIndex(x => (x._id || x.id) === (v._id || v.id)) === i).map(t => (
                    <tr key={t._id || t.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 font-medium text-on-surface">{t.clientName || t.clientEmail || '—'}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{t.serviceName}</td>
                      <td className="px-4 py-3 text-on-surface-variant">{t.date}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${t.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>{t.status}</span></td>
                      <td className="px-4 py-3">{t.treatmentNotes ? <span className="text-amber-400">✓</span> : <span className="text-white/20">—</span>}</td>
                      <td className="px-4 py-3">{t.prescription?.issuedAt ? <span className="text-blue-400">✓</span> : <span className="text-white/20">—</span>}</td>
                      <td className="px-4 py-3">{t.treatmentPayment ? <span className="text-emerald-400">{t.treatmentPayment.paymentStatus}</span> : <span className="text-white/20">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {myAppointments.length === 0 && clinicalTreatments.length === 0 && (
                <div className="p-10 text-center text-on-surface-variant text-sm">No history available yet.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TREATMENT NOTES ── */}
      {activeTab === 'treatment-notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-amber-400">edit_note</span>
              <h3 className="text-xl font-headline text-on-surface">Record Treatment Notes</h3>
            </div>
            <form onSubmit={saveTreatmentNotes} className="space-y-4">
              <div>
                <label className={labelCls}>Select Patient / Treatment</label>
                <select value={selectedTreatmentId} onChange={e => setSelectedTreatmentId(e.target.value)} required className={inputCls}>
                  <option value="">— Choose appointment —</option>
                  {myAppointments.map(a => (
                    <option key={a._id || a.id} value={a._id || a.id}>{a.clientName || a.clientEmail} — {a.serviceName} ({a.date})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Diagnosis</label>
                <input type="text" value={notesForm.diagnosis} onChange={e => setNotesForm(p => ({ ...p, diagnosis: e.target.value }))} className={inputCls} placeholder="e.g. Grade III Androgenetic Alopecia" />
              </div>
              <div>
                <label className={labelCls}>Clinical Notes</label>
                <textarea rows="4" value={notesForm.notes} onChange={e => setNotesForm(p => ({ ...p, notes: e.target.value }))} required className={inputCls} placeholder="Detailed consultation/treatment observations..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Session #</label>
                  <input type="number" min="1" value={notesForm.sessionNumber} onChange={e => setNotesForm(p => ({ ...p, sessionNumber: e.target.value }))} className={inputCls} placeholder="e.g. 2" />
                </div>
                <div>
                  <label className={labelCls}>Total Sessions</label>
                  <input type="number" min="1" value={notesForm.totalSessions} onChange={e => setNotesForm(p => ({ ...p, totalSessions: e.target.value }))} className={inputCls} placeholder="e.g. 6" />
                </div>
                <div>
                  <label className={labelCls}>Next Session</label>
                  <input type="date" value={notesForm.nextSessionDate} onChange={e => setNotesForm(p => ({ ...p, nextSessionDate: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <button type="submit" disabled={savingNotes} className="w-full bg-amber-500 text-black font-bold uppercase text-xs py-3 rounded-lg hover:bg-amber-400 transition-colors">
                {savingNotes ? 'Saving...' : 'Save Notes (Visible to Patient)'}
              </button>
            </form>
          </div>
          <div>
            <h3 className="text-lg font-headline text-on-surface mb-4">Recent Notes</h3>
            <div className="space-y-3">
              {(() => {
                // Merge myAppointments + clinicalTreatments (deduplicated) and filter those with notes
                const allWithNotes = [...myAppointments, ...clinicalTreatments]
                  .filter((v, i, arr) => arr.findIndex(x => (x._id || x.id) === (v._id || v.id)) === i)
                  .filter(a => a.treatmentNotes);
                if (allWithNotes.length === 0) {
                  return <p className="text-on-surface-variant text-sm">No notes saved yet.</p>;
                }
                return allWithNotes.map(a => (
                  <div key={a._id || a.id} className="bg-surface-container rounded-xl p-4 border border-white/5">
                    <p className="text-xs font-bold text-on-surface">{a.clientName || a.clientEmail}</p>
                    <p className="text-[10px] text-primary mt-0.5">{a.serviceName} · {a.date}</p>
                    {a.diagnosis && <p className="text-[10px] text-amber-400 mt-1">Dx: {a.diagnosis}</p>}
                    <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">{a.treatmentNotes}</p>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── PRESCRIPTIONS ── */}
      {activeTab === 'prescriptions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-blue-400">medication</span>
              <h3 className="text-xl font-headline text-on-surface">Issue Prescription</h3>
            </div>
            <form onSubmit={savePrescription} className="space-y-4">
              <div>
                <label className={labelCls}>Select Patient / Treatment</label>
                <select value={rxTreatmentId} onChange={e => setRxTreatmentId(e.target.value)} required className={inputCls}>
                  <option value="">— Choose appointment —</option>
                  {myAppointments.map(a => (
                    <option key={a._id || a.id} value={a._id || a.id}>{a.clientName || a.clientEmail} — {a.serviceName} ({a.date})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={labelCls + ' mb-0'}>Medicines</label>
                  <button type="button" onClick={addMedicine} className="text-[9px] text-primary border border-primary/20 px-2 py-0.5 rounded hover:bg-primary/10 transition-colors cursor-pointer">+ Add Medicine</button>
                </div>
                <div className="space-y-2">
                  {rxMedicines.map((m, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2 items-center">
                      <input value={m.name} onChange={e => updateMedicine(i, 'name', e.target.value)} placeholder="Medicine name" className={inputCls} />
                      <input value={m.dose} onChange={e => updateMedicine(i, 'dose', e.target.value)} placeholder="Dose e.g. 10mg" className={inputCls} />
                      <div className="flex gap-1">
                        <input value={m.frequency} onChange={e => updateMedicine(i, 'frequency', e.target.value)} placeholder="e.g. 1-0-1" className={inputCls} />
                        {rxMedicines.length > 1 && (
                          <button type="button" onClick={() => removeMedicine(i)} className="text-red-400 hover:text-red-300 text-[18px] material-symbols-outlined cursor-pointer flex-shrink-0">close</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Instructions / Directions</label>
                <textarea rows="2" value={rxForm.instructions} onChange={e => setRxForm(p => ({ ...p, instructions: e.target.value }))} className={inputCls} placeholder="e.g. Take after meals, avoid direct sunlight..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Dosage Details</label>
                  <input type="text" value={rxForm.dosageDetails} onChange={e => setRxForm(p => ({ ...p, dosageDetails: e.target.value }))} className={inputCls} placeholder="e.g. Apply 1ml to scalp..." />
                </div>
                <div>
                  <label className={labelCls}>Follow-up Date</label>
                  <input type="date" value={rxForm.followUpDate} onChange={e => setRxForm(p => ({ ...p, followUpDate: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <button type="submit" disabled={savingRx} className="w-full bg-blue-600 text-white font-bold uppercase text-xs py-3 rounded-lg hover:bg-blue-500 transition-colors">
                {savingRx ? 'Saving...' : 'Issue Prescription (Visible to Patient)'}
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-headline text-on-surface mb-4">Issued Prescriptions</h3>
            {loadingPrescriptions ? <p className="text-on-surface-variant">Loading...</p> : (
              <div className="space-y-3">
                {prescriptions.map(p => (
                  <div key={p._id || p.id} className="bg-surface-container rounded-xl p-4 border border-white/5 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-on-surface">{p.clientName || p.clientEmail}</p>
                        <p className="text-[10px] text-primary">{p.serviceName} · {p.date}</p>
                      </div>
                      {p.prescription?.followUpDate && (
                        <span className="text-[9px] text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 px-2 py-0.5 rounded">
                          Follow-up: {new Date(p.prescription.followUpDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {p.prescription?.medicines?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.prescription.medicines.map((m, i) => (
                          <span key={i} className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/15 px-2 py-0.5 rounded">
                            {m.name} {m.dose}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.prescription?.instructions && <p className="text-[10px] text-on-surface-variant">{p.prescription.instructions}</p>}
                  </div>
                ))}
                {prescriptions.length === 0 && <p className="text-on-surface-variant text-sm">No prescriptions issued yet.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TREATMENT PAYMENTS ── */}
      {activeTab === 'treatment-payments' && (() => {
        // Local state for this tab's two forms
        const selectedAppt = myAppointments.find(a => (a._id || a.id) === payTreatmentId);
        const tp = selectedAppt?.treatmentPayment;
        const agreedCost = tp?.agreedTotalCost || selectedAppt?.finalAmount || selectedAppt?.price || 0;
        const totalPaid = tp?.totalPaid || 0;
        const balanceDue = tp?.balanceDue ?? Math.max(0, agreedCost - totalPaid);

        return (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-400">account_balance_wallet</span>
              <div>
                <h3 className="text-xl font-headline text-on-surface">Treatment Billing</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Set the patient-specific cost, then record installment payments as cash comes in.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── LEFT: Select + Cost + Installment forms ── */}
              <div className="lg:col-span-2 space-y-6">

                {/* Step 1 — Select patient */}
                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-3">
                    Step 1 · Select Patient
                  </p>
                  <select
                    value={payTreatmentId}
                    onChange={e => { setPayTreatmentId(e.target.value); fetchTreatmentPayments(); }}
                    className={inputCls}
                  >
                    <option value="">— Choose appointment —</option>
                    {myAppointments.map(a => (
                      <option key={a._id || a.id} value={a._id || a.id}>
                        {a.clientName || a.clientEmail} — {a.serviceName} ({a.date})
                      </option>
                    ))}
                  </select>
                  {selectedAppt && (
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-on-surface-variant">
                      <span>📋 Catalogue price: <strong className="text-on-surface">{formatCurrency(selectedAppt.finalAmount || selectedAppt.price)}</strong></span>
                      {tp?.agreedTotalCost && (
                        <span>💰 Agreed cost: <strong className="text-emerald-400">{formatCurrency(tp.agreedTotalCost)}</strong></span>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 2 — Set agreed total cost */}
                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-1">
                    Step 2 · Set Agreed Treatment Cost
                  </p>
                  <p className="text-[10px] text-on-surface-variant/60 mb-4">
                    The actual cost quoted to this patient (may differ from catalogue price based on grade, sessions, customisation).
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Total Treatment Cost (₹)</label>
                      <input
                        type="number" min="0"
                        value={payForm.agreedTotalCost || ''}
                        onChange={e => setPayForm(p => ({ ...p, agreedTotalCost: e.target.value }))}
                        className={inputCls}
                        placeholder={`e.g. ${selectedAppt ? (selectedAppt.finalAmount || selectedAppt.price) : '80000'}`}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Payment Plan Notes</label>
                      <input
                        type="text"
                        value={payForm.paymentPlanNotes || ''}
                        onChange={e => setPayForm(p => ({ ...p, paymentPlanNotes: e.target.value }))}
                        className={inputCls}
                        placeholder="e.g. 50% advance, rest after session 3"
                      />
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!payTreatmentId) return toast.error('Please select a patient first');
                      if (!payForm.agreedTotalCost) return toast.error('Enter the agreed total cost');
                      setSavingPay(true);
                      try {
                        const res = await axios.put(
                          `${API_URL}/staff/appointments/${payTreatmentId}/treatment-cost`,
                          { agreedTotalCost: payForm.agreedTotalCost, paymentPlanNotes: payForm.paymentPlanNotes },
                          { headers: getAuthHeader() }
                        );
                        if (res.data.success) { toast.success('Treatment cost set'); await fetchAppointments(); fetchTreatmentPayments(); }
                      } catch { toast.error('Failed to set cost'); }
                      finally { setSavingPay(false); }
                    }}
                    disabled={savingPay}
                    className="mt-4 w-full bg-white/5 border border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-on-surface hover:text-emerald-300 font-bold uppercase text-xs py-2.5 rounded-lg transition-all cursor-pointer"
                  >
                    {savingPay ? 'Saving...' : '💰 Confirm Agreed Cost'}
                  </button>
                </div>

                {/* Step 3 — Record installment */}
                <div className="glass-panel p-5 rounded-2xl border border-white/10">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-1">
                    Step 3 · Record a Payment Received
                  </p>
                  <p className="text-[10px] text-on-surface-variant/60 mb-4">
                    Each time the patient pays (advance, EMI, final), add an entry here.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Amount Received (₹) *</label>
                      <input
                        type="number" min="1" required
                        value={payForm.amountReceived || ''}
                        onChange={e => setPayForm(p => ({ ...p, amountReceived: e.target.value }))}
                        className={inputCls}
                        placeholder="e.g. 25000"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Payment Mode</label>
                      <select value={payForm.paymentMode} onChange={e => setPayForm(p => ({ ...p, paymentMode: e.target.value }))} className={inputCls}>
                        {['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Online'].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Reference / Transaction ID</label>
                      <input
                        type="text"
                        value={payForm.referenceNumber || ''}
                        onChange={e => setPayForm(p => ({ ...p, referenceNumber: e.target.value }))}
                        className={inputCls}
                        placeholder="UPI ref / Cheque no / Txn ID"
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Payment Date</label>
                      <input
                        type="date"
                        value={payForm.paidOn || new Date().toISOString().split('T')[0]}
                        onChange={e => setPayForm(p => ({ ...p, paidOn: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={labelCls}>Remarks</label>
                    <input type="text" value={payForm.remarks || ''} onChange={e => setPayForm(p => ({ ...p, remarks: e.target.value }))} className={inputCls} placeholder="e.g. Advance for session 1" />
                  </div>
                  <button
                    onClick={async () => {
                      if (!payTreatmentId) return toast.error('Please select a patient first');
                      if (!payForm.amountReceived) return toast.error('Enter amount received');
                      setSavingPay(true);
                      try {
                        const res = await axios.post(
                          `${API_URL}/staff/appointments/${payTreatmentId}/treatment-payment`,
                          {
                            amount: payForm.amountReceived,
                            paymentMode: payForm.paymentMode,
                            referenceNumber: payForm.referenceNumber,
                            paidOn: payForm.paidOn,
                            remarks: payForm.remarks
                          },
                          { headers: getAuthHeader() }
                        );
                        if (res.data.success) {
                          toast.success('Payment recorded — patient can see updated balance');
                          setPayForm(p => ({ ...p, amountReceived: '', referenceNumber: '', remarks: '' }));
                          await fetchAppointments();
                          fetchTreatmentPayments();
                        }
                      } catch { toast.error('Failed to record payment'); }
                      finally { setSavingPay(false); }
                    }}
                    disabled={savingPay}
                    className="mt-4 w-full bg-emerald-600 text-white font-bold uppercase text-xs py-3 rounded-lg hover:bg-emerald-500 transition-colors cursor-pointer"
                  >
                    {savingPay ? 'Recording...' : '✓ Add Payment Entry (Visible to Patient)'}
                  </button>
                </div>
              </div>

              {/* ── RIGHT: Live billing ledger ── */}
              <div className="space-y-4">
                <h4 className="text-sm font-headline text-on-surface">
                  {selectedAppt ? `${selectedAppt.clientName || selectedAppt.clientEmail}'s Ledger` : 'Patient Ledger'}
                </h4>

                {!selectedAppt ? (
                  <div className="glass-panel rounded-2xl p-8 text-center border border-white/5">
                    <span className="material-symbols-outlined text-3xl text-on-surface-variant/20 block mb-2">receipt_long</span>
                    <p className="text-xs text-on-surface-variant">Select a patient to see their billing ledger</p>
                  </div>
                ) : (
                  <>
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { label: 'Total Cost', value: formatCurrency(agreedCost), color: 'text-on-surface', bg: 'bg-white/5' },
                        { label: 'Total Paid', value: formatCurrency(totalPaid), color: 'text-emerald-400', bg: 'bg-emerald-500/5' },
                        { label: 'Balance Due', value: formatCurrency(balanceDue), color: balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400', bg: balanceDue > 0 ? 'bg-amber-500/5' : 'bg-emerald-500/5' },
                      ].map(s => (
                        <div key={s.label} className={`${s.bg} border border-white/5 rounded-xl p-3 flex justify-between items-center`}>
                          <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">{s.label}</span>
                          <span className={`text-base font-headline font-bold ${s.color}`}>{s.value}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Status</span>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                          tp?.paymentStatus === 'Settled' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                          tp?.paymentStatus === 'Partial' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
                          'bg-red-500/15 text-red-400 border-red-500/25'
                        }`}>{tp?.paymentStatus || 'Pending'}</span>
                      </div>
                    </div>

                    {tp?.paymentPlanNotes && (
                      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 text-xs text-blue-300/80 italic">
                        📋 {tp.paymentPlanNotes}
                      </div>
                    )}

                    {/* Payment installments list */}
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-2">
                        Payment History ({tp?.payments?.length || 0} entries)
                      </p>
                      {(!tp?.payments || tp.payments.length === 0) ? (
                        <p className="text-xs text-on-surface-variant/60">No payments recorded yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                          {tp.payments.map((pmt, i) => (
                            <div key={i} className={`rounded-lg p-3 border text-xs ${pmt.paymentMode?.toLowerCase().includes('online') || pmt.paymentMode?.toLowerCase().includes('razorpay') ? 'bg-blue-500/[0.04] border-blue-500/20' : 'bg-surface-container border-white/5'}`}>
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-emerald-400">+{formatCurrency(pmt.amount)}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1 ${
                                  pmt.paymentMode?.toLowerCase().includes('online') || pmt.paymentMode?.toLowerCase().includes('razorpay')
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                    : 'bg-white/5 text-on-surface-variant'
                                }`}>
                                  {pmt.paymentMode?.toLowerCase().includes('online') && (
                                    <span className="material-symbols-outlined text-[11px]">bolt</span>
                                  )}
                                  {pmt.paymentMode}
                                </span>
                              </div>
                              <p className="text-[10px] text-on-surface-variant mt-1">
                                {new Date(pmt.paidOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                {pmt.referenceNumber && (
                                  <span className="ml-2 font-mono text-primary/80 font-bold">#{pmt.referenceNumber}</span>
                                )}
                              </p>
                              {pmt.remarks && <p className="text-[10px] text-on-surface-variant/80 italic mt-0.5">{pmt.remarks}</p>}
                              <p className="text-[9px] text-on-surface-variant/40 mt-1 font-mono">
                                Recorded by {pmt.recordedBy}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* All patients payment summary */}
                <div className="mt-4 border-t border-white/5 pt-4">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest mb-3">All Patients</p>
                  {loadingPayments ? <p className="text-xs text-on-surface-variant">Loading...</p> : (
                    <div className="space-y-2">
                      {treatmentPayments.length === 0 ? (
                        <p className="text-xs text-on-surface-variant/60">No payment records yet.</p>
                      ) : treatmentPayments.map(p => (
                        <button
                          key={p._id || p.id}
                          onClick={() => setPayTreatmentId(p._id || p.id)}
                          className={`w-full text-left bg-surface-container rounded-lg p-2.5 border transition-all cursor-pointer text-xs ${payTreatmentId === (p._id || p.id) ? 'border-primary/30 bg-primary/5' : 'border-white/5 hover:border-white/15'}`}
                        >
                          <div className="flex justify-between items-center">
                            <p className="font-bold text-on-surface">{p.clientName || p.clientEmail}</p>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${p.treatmentPayment?.paymentStatus === 'Settled' ? 'bg-emerald-500/15 text-emerald-400' : p.treatmentPayment?.paymentStatus === 'Partial' ? 'bg-amber-500/15 text-amber-400' : 'bg-red-500/15 text-red-400'}`}>
                              {p.treatmentPayment?.paymentStatus || 'Pending'}
                            </span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{p.serviceName}</p>
                          <div className="flex gap-2 mt-1 text-[9px] text-on-surface-variant/60">
                            <span>Paid: <strong className="text-emerald-400">{formatCurrency(p.treatmentPayment?.totalPaid || 0)}</strong></span>
                            <span>Due: <strong className="text-amber-400">{formatCurrency(p.treatmentPayment?.balanceDue ?? 0)}</strong></span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default StaffDashboard;

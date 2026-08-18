import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";
import { toast } from 'sonner';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}`;
const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBF2oOfX0IEdPCxqmQfKy_LRpiHYFpyIqgGKSYp7seSubUFyBNidldBY0QfL8DuvowILktYq-40hs3F4EjhYLswKqWOxjDCLPzuJHTl_NsRfxekhDrUpOsEqdAHn3ixK0nY6WTgsWY_pV-M6sogXrqj2OpwVJQvgSEX-lMK38SJuclC2wHD1iRPJZ2QsyZsrsPqALn81YqyZbTlLKeEhtFRNbIImHbZ63P8seZj9vWGLEQRFQHgwenODdn7wt5HQjaUF_m_ppyCPw';

const resolveImageUrl = (src) => {
  if (!src) return DEFAULT_AVATAR;
  if (src.startsWith('data:') || src.startsWith('http')) return src;
  if (src.startsWith('/')) return `${API_BASE}${src}`;
  return src;
};

const StaffPayouts = () => {
  const { barbers, refreshData } = useApp();
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutType, setPayoutType] = useState('full'); // 'full' or 'custom'

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('luxe_admin_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handlePayClick = (barber, type) => {
    setSelectedBarber(barber);
    setPayoutType(type);
    if (type === 'full') {
      const pending = Math.max(0, barber.revenue - (barber.paidAmount || 0));
      setPayoutAmount(pending.toString());
    } else {
      setPayoutAmount('');
    }
    setShowPayoutModal(true);
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBarber) return;

    const pending = Math.max(0, selectedBarber.revenue - (selectedBarber.paidAmount || 0));
    const amountToPay = Number(payoutAmount);

    if (isNaN(amountToPay) || amountToPay <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    if (amountToPay > pending && payoutType === 'custom') {
      toast.error(`Payout amount cannot exceed the pending balance of ${formatCurrency(pending)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/admin/barbers/${selectedBarber._id || selectedBarber.id}/pay`,
        { amount: amountToPay },
        { headers: getAuthHeader() }
      );

      if (res.data.success) {
        toast.success(`Successfully processed payout of ${formatCurrency(amountToPay)} for ${selectedBarber.name}`);
        setShowPayoutModal(false);
        setSelectedBarber(null);
        setPayoutAmount('');
        refreshData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process payout.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute overall totals
  const totalRevenue = barbers.reduce((sum, b) => sum + (b.revenue || 0), 0);
  const totalPaid = barbers.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const pendingPayouts = Math.max(0, totalRevenue - totalPaid);

  // Compile all historic payouts
  const allPayouts = barbers.reduce((list, b) => {
    if (b.payouts && Array.isArray(b.payouts)) {
      b.payouts.forEach(p => {
        list.push({
          payoutId: p._id || p.id || Math.random().toString(),
          barberName: b.name,
          barberRole: b.role,
          barberImage: b.image,
          amount: p.amount,
          date: p.date
        });
      });
    }
    return list;
  }, []).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <main className="pt-28 px-4 md:px-8 max-w-[1600px] mx-auto font-body pb-32">
      {/* Page Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-headline text-on-surface tracking-tight">Staff Revenue &amp; Payouts</h2>
        <p className="text-sm text-on-surface-variant mt-1">Track staff earnings, record payments, and manage payouts history.</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-primary/30 transition-all">
          <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Total Revenue Generated</span>
          <h3 className="text-2xl font-headline font-bold text-on-surface mt-2">{formatCurrency(totalRevenue)}</h3>
          <span className="text-[9px] text-on-surface-variant mt-1">Earned by all specialists</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-primary/30 transition-all">
          <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Total Paid Out</span>
          <h3 className="text-2xl font-headline font-bold text-green-400 mt-2">{formatCurrency(totalPaid)}</h3>
          <span className="text-[9px] text-green-400 mt-1">Disbursed to staff members</span>
        </div>
        <div className="glass-panel p-6 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-primary/30 transition-all">
          <span className="text-[10px] text-on-surface-variant uppercase font-semibold">Pending Balance</span>
          <h3 className="text-2xl font-headline font-bold text-primary mt-2">{formatCurrency(pendingPayouts)}</h3>
          <span className="text-[9px] text-primary mt-1">Awaiting settlement</span>
        </div>
      </div>

      {/* Staff Revenue Table */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-2xl mb-8">
        <div className="p-6 border-b border-white/10 bg-white/5">
          <h4 className="text-lg font-headline text-on-surface">Staff Ledger</h4>
          <p className="text-xs text-on-surface-variant">Review total commission and pay out pending balances.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] text-on-surface-variant uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-semibold">Specialist</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Payment Details</th>
                <th className="px-6 py-4 font-semibold">Total Revenue</th>
                <th className="px-6 py-4 font-semibold">Paid Amount</th>
                <th className="px-6 py-4 font-semibold">Pending Balance</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {barbers.map(barber => {
                const pending = Math.max(0, (barber.revenue || 0) - (barber.paidAmount || 0));
                return (
                  <tr key={barber._id || barber.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-on-surface">
                      <div className="flex items-center gap-3">
                        <img 
                          src={resolveImageUrl(barber.image)} 
                          alt={barber.name} 
                          className="w-10 h-10 rounded-full object-cover border border-primary/20"
                          onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                        />
                        <span>{barber.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{barber.role}</td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {barber.upiId ? (
                        <div className="flex items-center gap-1.5 text-xs text-primary bg-primary/5 border border-primary/20 px-2 py-1 rounded w-fit">
                          <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                          <span>UPI: {barber.upiId}</span>
                        </div>
                      ) : barber.bankAccountNumber ? (
                        <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/5 border border-blue-500/20 px-2 py-1 rounded w-fit">
                          <span className="material-symbols-outlined text-[14px]">account_balance</span>
                          <span className="max-w-[150px] truncate" title={barber.bankAccountNumber}>Bank Info</span>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">Not Provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">{formatCurrency(barber.revenue || 0)}</td>
                    <td className="px-6 py-4 text-green-400 font-semibold">{formatCurrency(barber.paidAmount || 0)}</td>
                    <td className={`px-6 py-4 font-bold ${pending > 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {formatCurrency(pending)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={pending <= 0}
                          onClick={() => handlePayClick(barber, 'full')}
                          className="px-3 py-1.5 bg-green-950/20 border border-green-500/30 text-green-400 hover:bg-green-500 hover:text-white text-[10px] font-bold uppercase rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          Pay Full
                        </button>
                        <button
                          disabled={pending <= 0}
                          onClick={() => handlePayClick(barber, 'custom')}
                          className="px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-on-primary text-[10px] font-bold uppercase rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          Pay Certain
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {barbers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-on-surface-variant text-sm">No specialists found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout History Log */}
      <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10 bg-white/5">
          <h4 className="text-lg font-headline text-on-surface">Payout Logs</h4>
          <p className="text-xs text-on-surface-variant">Timeline of recent payouts executed for the salon specialists.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] text-on-surface-variant uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4 font-semibold">Date &amp; Time</th>
                <th className="px-6 py-4 font-semibold">Specialist</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold text-right">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {allPayouts.map((log, index) => (
                <tr key={log.payoutId + '-' + index} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-on-surface-variant">
                    {new Date(log.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-semibold text-on-surface">
                    <div className="flex items-center gap-3">
                      <img 
                        src={resolveImageUrl(log.barberImage)} 
                        alt={log.barberName} 
                        className="w-8 h-8 rounded-full object-cover border border-primary/20"
                        onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                      />
                      <span>{log.barberName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">{log.barberRole}</td>
                  <td className="px-6 py-4 text-green-400 font-bold text-right">{formatCurrency(log.amount)}</td>
                </tr>
              ))}
              {allPayouts.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-on-surface-variant text-sm">No payout logs available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && selectedBarber && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md border border-white/10 relative" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-headline text-on-surface mb-2">
              {payoutType === 'full' ? 'Process Full Payout' : 'Pay Custom Amount'}
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">
              {payoutType === 'full' 
                ? `Confirm full settlement of pending revenues to ${selectedBarber.name}.` 
                : `Enter the amount you would like to pay to ${selectedBarber.name}.`}
            </p>

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">
                  Staff Specialist
                </label>
                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10 mb-4">
                  <img 
                    src={resolveImageUrl(selectedBarber.image)} 
                    alt={selectedBarber.name} 
                    className="w-10 h-10 rounded-full object-cover border border-primary/20"
                    onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{selectedBarber.name}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wide">{selectedBarber.role}</p>
                  </div>
                </div>

                {/* Transfer details display */}
                {(selectedBarber.upiId || selectedBarber.bankAccountNumber) ? (
                  <div className="bg-white/5 p-3 rounded-lg border border-white/10 mb-4 space-y-2">
                    <p className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold">Transfer Details</p>
                    {selectedBarber.upiId && (
                      <div className="flex items-center justify-between text-xs text-on-surface">
                        <span className="text-on-surface-variant font-medium">UPI ID:</span>
                        <span className="font-mono text-primary font-semibold select-all">{selectedBarber.upiId}</span>
                      </div>
                    )}
                    {selectedBarber.bankAccountNumber && (
                      <div className="flex flex-col text-xs text-on-surface">
                        <span className="text-on-surface-variant font-medium">Bank Info:</span>
                        <span className="font-mono select-all bg-white/4 p-1.5 rounded mt-1 whitespace-pre-wrap">{selectedBarber.bankAccountNumber}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-xs">
                    ⚠️ Specialist has not configured payment details.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">
                  Payout Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  max={payoutType === 'full' ? undefined : selectedBarber.revenue - (selectedBarber.paidAmount || 0)}
                  disabled={payoutType === 'full'}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-on-surface"
                  placeholder="e.g. 500"
                  required
                />
                <span className="text-[10px] text-on-surface-variant mt-1.5 block">
                  Remaining Pending Balance: {formatCurrency(Math.max(0, selectedBarber.revenue - (selectedBarber.paidAmount || 0)))}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => { setShowPayoutModal(false); setSelectedBarber(null); }}
                  className="px-4 py-2 border border-white/10 text-xs uppercase font-bold rounded-lg text-on-surface-variant hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary text-on-primary text-xs uppercase font-bold rounded-lg cursor-pointer hover:brightness-110 flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Payout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default StaffPayouts;

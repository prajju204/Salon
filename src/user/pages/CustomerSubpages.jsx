import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from "@/shared/context/AuthContext";
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";

const CustomerSubpages = () => {
  const { user, updateProfile, resendVerification } = useAuth();
  const { appointments, reviews, addReview, barbers } = useApp();
  const location = useLocation();

  const getTabFromPath = (path) => {
    if (path.includes('payments')) return 'payments';
    if (path.includes('reviews')) return 'reviews';
    if (path.includes('profile')) return 'profile';
    return 'history';
  };

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // Filter user data
  const userAppointments = appointments.filter(apt => apt.clientEmail === user?.email);
  const userReviews = reviews.filter(rev => rev.clientName === user?.name);

  // Form states for writing a review
  const [reviewBarber, setReviewBarber] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Profile form states
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileMobile, setProfileMobile] = useState(user?.mobile || '');
  const [isEditing, setIsEditing] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileEmail(user.email || '');
      setProfileMobile(user.mobile || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    try {
      const res = await updateProfile(profileName, profileEmail, profileMobile);
      if (res.devVerificationLink) {
        setProfileSuccess(`[DEV MODE] Verification Link: ${res.devVerificationLink}`);
      } else {
        setProfileSuccess(res.message || 'Profile updated successfully.');
      }
      setIsEditing(false);
      setTimeout(() => setProfileSuccess(''), 10000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    }
  };

  const handleResend = async () => {
    setResending(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const res = await resendVerification(user?.email);
      if (res.devVerificationLink) {
        setProfileSuccess(`[DEV MODE] Verification Link: ${res.devVerificationLink}`);
      } else {
        setProfileSuccess(res.message || 'Verification email sent. Please check your inbox.');
      }
      setTimeout(() => setProfileSuccess(''), 10000);
    } catch (err) {
      setProfileError(err.message || 'Failed to resend verification.');
    } finally {
      setResending(false);
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewBarber) return;

    addReview({
      clientName: user?.name || 'James Mercer',
      rating: parseInt(reviewRating),
      text: reviewText,
      barberName: reviewBarber
    });

    setReviewText('');
    setSuccessMsg('Thank you! Your luxury grooming review has been posted.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto font-body">
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-headline text-on-surface">Client Portal</h2>
          <p className="text-xs text-on-surface-variant">Manage your luxury scheduling history, payments, and ratings.</p>
        </div>
        <div className="flex gap-2 bg-surface-container p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              activeTab === 'history' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              activeTab === 'payments' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              activeTab === 'reviews' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Reviews
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
              activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:text-white'
            }`}
          >
            Profile
          </button>
        </div>
      </div>

      {/* --- HISTORY TAB --- */}
      {activeTab === 'history' && (
        <div className="glass-panel rounded-xl overflow-hidden shadow-2xl">
          <div className="p-unit-lg border-b border-white/10">
            <h4 className="text-lg font-headline text-on-surface">Your Booking History</h4>
          </div>
          <div className="overflow-x-auto">
            {userAppointments.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm">No scheduling records found.</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-white/5 text-[10px] text-on-surface-variant uppercase tracking-widest">
                  <tr>
                    <th className="px-unit-lg py-4 font-semibold">Service</th>
                    <th className="px-unit-lg py-4 font-semibold">Date & Time</th>
                    <th className="px-unit-lg py-4 font-semibold">Barber</th>
                    <th className="px-unit-lg py-4 font-semibold">Price</th>
                    <th className="px-unit-lg py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {userAppointments.map(apt => (
                    <tr key={apt.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-unit-lg py-4 text-on-surface font-semibold">{apt.serviceName}</td>
                      <td className="px-unit-lg py-4 text-on-surface-variant">{apt.date} at {apt.time}</td>
                      <td className="px-unit-lg py-4 text-on-surface-variant">{apt.barberName}</td>
                      <td className="px-unit-lg py-4 text-primary font-bold">{formatCurrency(apt.price)}</td>
                      <td className="px-unit-lg py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          apt.status === 'Completed'
                            ? 'bg-green-950/20 border border-green-500/30 text-green-400'
                            : apt.status === 'In Progress'
                            ? 'bg-primary/20 border border-primary/30 text-primary animate-pulse'
                            : apt.status === 'Cancelled'
                            ? 'bg-red-950/20 border border-red-500/30 text-red-400'
                            : 'bg-white/10 text-on-surface-variant'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* --- PAYMENTS TAB --- */}
      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="md:col-span-2 glass-panel rounded-xl p-unit-lg space-y-6">
            <h4 className="text-lg font-headline text-on-surface mb-4">Billing History</h4>
            <div className="space-y-4">
              {userAppointments.map(apt => (
                <div key={apt.id} className="p-4 rounded-xl bg-white/5 flex items-center justify-between border border-white/5">
                  <div className="flex gap-3 items-center">
                    <span className="material-symbols-outlined text-primary p-2 bg-primary/10 rounded-lg">receipt_long</span>
                    <div>
                      <h5 className="font-semibold text-sm text-on-surface">{apt.serviceName} Invoice</h5>
                      <p className="text-xs text-on-surface-variant">{apt.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{formatCurrency(apt.price)}</p>
                    <span className="text-[10px] uppercase font-bold text-green-400">Paid</span>
                  </div>
                </div>
              ))}
              {userAppointments.length === 0 && (
                <p className="text-center py-4 text-on-surface-variant text-sm">No transaction statements available.</p>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-unit-lg space-y-6 h-fit">
            <h4 className="text-lg font-headline text-on-surface">Stored Cards</h4>
            <div className="p-5 bg-gradient-to-br from-primary-container to-yellow-700 rounded-xl relative overflow-hidden text-black h-40 flex flex-col justify-between shadow-2xl">
              <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold uppercase tracking-widest">Luxe Groom Card</span>
                <span className="material-symbols-outlined text-2xl font-bold">credit_card</span>
              </div>
              <div>
                <p className="text-md font-bold tracking-widest">•••• •••• •••• 4892</p>
                <div className="flex justify-between mt-2 text-[10px] font-semibold uppercase">
                  <span>{user?.name}</span>
                  <span>12/28</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- REVIEWS TAB --- */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {/* Review Form */}
          <div className="md:col-span-1 glass-panel rounded-xl p-unit-lg h-fit">
            <h4 className="text-lg font-headline text-on-surface mb-4">Rate Your Stylist</h4>
            
            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-green-950/20 border border-green-500/30 text-green-400 text-xs">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Select Barber</label>
                <select
                  value={reviewBarber}
                  onChange={(e) => setReviewBarber(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary font-body"
                  required
                >
                  <option value="">-- Choose Stylist --</option>
                  {barbers.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-primary hover:scale-110 transition-transform cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-2xl ${reviewRating >= star ? 'fill-current' : ''}`}>star</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Review Details</label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows="4"
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary font-body"
                  placeholder="Share your grooming experience..."
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/20"
              >
                Submit Review
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="md:col-span-2 glass-panel rounded-xl p-unit-lg space-y-6">
            <h4 className="text-lg font-headline text-on-surface mb-4">Your Submitted Reviews</h4>
            <div className="space-y-4">
              {userReviews.map(rev => (
                <div key={rev.id} className="p-4 rounded-xl bg-white/5 border border-white/5 relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h5 className="font-semibold text-sm text-on-surface">
                        {rev.barberName?.toLowerCase().startsWith('dr.') ? 'Doctor:' : 'Stylist:'} {rev.barberName}
                      </h5>
                      <span className="text-[10px] text-on-surface-variant">{rev.date}</span>
                    </div>
                    <div className="flex text-primary">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[18px] fill-current">star</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant italic font-body">"{rev.text}"</p>
                </div>
              ))}
              {userReviews.length === 0 && (
                <p className="text-center py-4 text-on-surface-variant text-sm">You haven't submitted any reviews yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- PROFILE TAB --- */}
      {activeTab === 'profile' && (
        <div className="glass-panel rounded-xl p-unit-lg max-w-xl mx-auto space-y-6">
          <div className="border-b border-white/10 pb-4 flex justify-between items-center">
            <div>
              <h4 className="text-lg font-headline text-on-surface">Your Account Profile</h4>
              <p className="text-xs text-on-surface-variant">View and edit your registered details.</p>
            </div>
            <div>
              {user?.email_verified ? (
                <span className="px-3 py-1 bg-green-950/20 border border-green-500/30 text-green-400 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span> Verified
                </span>
              ) : (
                <div className="flex flex-col items-end gap-1.5">
                  <span className="px-3 py-1 bg-amber-950/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm animate-pulse">warning</span> Unverified
                  </span>
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-[9px] uppercase font-bold text-primary hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {resending ? 'Sending...' : 'Resend Verification'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {profileSuccess && (
            <div className="p-4 rounded-xl bg-green-950/20 border border-green-500/30 text-green-300 text-xs">
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-300 text-xs">
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4 font-body">
            <div>
              <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary"
                  required
                />
              ) : (
                <p className="text-sm text-on-surface bg-white/5 p-3 rounded-lg border border-white/5">{user?.name}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Email Address</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary"
                  required
                />
              ) : (
                <p className="text-sm text-on-surface bg-white/5 p-3 rounded-lg border border-white/5">{user?.email}</p>
              )}
            </div>

            <div>
              <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Mobile Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileMobile}
                  onChange={(e) => setProfileMobile(e.target.value)}
                  className="w-full bg-surface-container border border-white/10 rounded-lg px-3 py-2 text-on-surface text-sm focus:outline-none focus:border-primary"
                  required
                />
              ) : (
                <p className="text-sm text-on-surface bg-white/5 p-3 rounded-lg border border-white/5">{user?.mobile || '+91 98765 43210'}</p>
              )}
            </div>

            <div>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-1">Account Role</p>
              <span className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-bold uppercase tracking-wide">
                {user?.role}
              </span>
            </div>

            <div className="flex gap-3 pt-4">
              {isEditing ? (
                <>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/20"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setProfileName(user?.name || '');
                      setProfileEmail(user?.email || '');
                      setProfileMobile(user?.mobile || '');
                      setProfileError('');
                    }}
                    className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-on-surface hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-lg text-xs font-bold uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-lg shadow-primary/20"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </main>
  );
};

export default CustomerSubpages;

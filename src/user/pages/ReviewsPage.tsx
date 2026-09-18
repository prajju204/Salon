import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from "@/shared/context/AppContext";
import { useAuth } from "@/shared/context/AuthContext";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/components/ui/dialog";
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { StylistReview } from "@/shared/types/review";
import { Appointment } from "@/shared/types/booking";

// Mock public testimonials (from all users)
const mockTestimonials: StylistReview[] = [
  {
    id: 't1',
    clientName: 'Rahul Sharma',
    clientAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    barberName: 'Alexander Wright',
    rating: 5,
    text: 'Best scissor cut in town! Alexander pays close attention to detail and takes his time to get it absolutely perfect.',
    date: '2026-06-28',
    serviceTag: 'Executive Scissor Cut',
    ratingsDetail: { serviceQuality: 5, stylist: 5, cleanliness: 5 }
  },
  {
    id: 't2',
    clientName: 'Aarav Patel',
    clientAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    barberName: 'Marcus Sterling',
    rating: 5,
    text: 'Marcus is an absolute beard wizard. The lineup is incredibly clean and the argan oil treatment feels premium.',
    date: '2026-06-25',
    serviceTag: 'Royal Beard Detail',
    ratingsDetail: { serviceQuality: 5, stylist: 5, cleanliness: 5 }
  },
  {
    id: 't3',
    clientName: 'Vikram Singh',
    clientAvatar: 'https://images.unsplash.com/photo-1620122303020-43ec4b6cf7f8?w=100&auto=format&fit=crop&q=80',
    barberName: 'Jordan Vance',
    rating: 4,
    text: 'Very relaxing charcoal facial. The massage was excellent, but the wait times were slightly longer than expected.',
    date: '2026-06-22',
    serviceTag: 'Charcoal Detox Facial',
    ratingsDetail: { serviceQuality: 4, stylist: 5, cleanliness: 4 }
  },
  {
    id: 't4',
    clientName: 'Arjun Mehta',
    clientAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
    barberName: 'David Croft',
    rating: 5,
    text: 'Highly recommend the Luxe Ritual Package. David Croft is extremely professional. The gold leaf massage was worth every rupee!',
    date: '2026-06-18',
    serviceTag: 'The Luxe Ritual Package',
    ratingsDetail: { serviceQuality: 5, stylist: 5, cleanliness: 5 }
  }
];

const ReviewsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    reviews,
    appointments,
    addStylistReview,
    deleteStylistReview,
    updateStylistReview
  } = useApp();

  const location = useLocation();
  const navigate = useNavigate();

  // Route State: Tab selection
  const [activeTab, setActiveTab] = useState('testimonials');

  // Interactive review prompt dialog state
  const [reviewTriggerOpen, setReviewTriggerOpen] = useState(false);
  const [targetApt, setTargetApt] = useState<Appointment | null>(null);

  // Form details
  const [overallRating, setOverallRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [stylistRating, setStylistRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [photoPlaceholder, setPhotoPlaceholder] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editing state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Testimonials filters & sort
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Newest'); // Newest, Highest, Lowest

  const categories = ['All', 'Haircuts', 'Beard', 'Facials', 'Packages'];

  // Check query parameters to trigger post-appointment reviews
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const triggerId = params.get('triggerReview');
    if (triggerId && appointments.length > 0) {
      const apt = appointments.find((a: Appointment) => a.id === triggerId || a._id === triggerId);
      if (apt && apt.status === 'Completed') {
        setTargetApt(apt);
        // Reset form values
        setOverallRating(5);
        setQualityRating(5);
        setStylistRating(5);
        setCleanlinessRating(5);
        setReviewText('');
        setPhotoPlaceholder([]);
        setReviewTriggerOpen(true);
        // Clear query parameter
        navigate('/reviews', { replace: true });
      }
    }
  }, [location.search, appointments, navigate]);

  // Aggregate user reviews & testimonials
  const allTestimonials = [...mockTestimonials, ...reviews];

  // Filters & Sorting logic
  const filteredTestimonials = allTestimonials.filter(item => {
    if (selectedCategory === 'All') return true;
    
    // Guess category from serviceTag keyword
    const tag = (item.serviceTag || '').toLowerCase();
    if (selectedCategory === 'Haircuts') return tag.includes('cut') || tag.includes('fade');
    if (selectedCategory === 'Beard') return tag.includes('beard') || tag.includes('shave');
    if (selectedCategory === 'Facials') return tag.includes('facial') || tag.includes('mask');
    if (selectedCategory === 'Packages') return tag.includes('package') || tag.includes('ritual') || tag.includes('privilege');
    return true;
  });

  const sortedTestimonials = [...filteredTestimonials].sort((a, b) => {
    if (sortBy === 'Highest') return b.rating - a.rating;
    if (sortBy === 'Lowest') return a.rating - b.rating;
    return new Date(b.date).getTime() - new Date(a.date).getTime(); // Newest
  });

  // Photo upload simulator
  const handlePhotoClick = () => {
    if (photoPlaceholder.length >= 3) {
      toast.warning('Max 3 images reached.');
      return;
    }
    const sampleUrls = [
      'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300&auto=format&fit=crop&q=80'
    ];
    // Add next image
    const nextImg = sampleUrls[photoPlaceholder.length];
    setPhotoPlaceholder(prev => [...prev, nextImg]);
    toast.success('Mock photo attached.');
  };

  // Submit Review Handler
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetApt) return;
    if (reviewText.length > 500) {
      toast.error('Review exceeds 500 characters limit.');
      return;
    }

    setIsSubmitting(true);
    
    addStylistReview({
      clientName: user?.name || 'James Mercer',
      barberName: targetApt.barberName,
      rating: overallRating,
      ratingsDetail: {
        serviceQuality: qualityRating,
        stylist: stylistRating,
        cleanliness: cleanlinessRating
      },
      text: reviewText,
      serviceTag: targetApt.serviceName,
      images: photoPlaceholder
    });

    setReviewTriggerOpen(false);
    setIsSubmitting(false);
    setActiveTab('myreviews');
  };

  // Edit Review triggers
  const handleEditClick = (rev: StylistReview) => {
    setEditingReviewId(rev.id);
    setEditText(rev.text);
    setEditRating(rev.rating);
    setEditModalOpen(true);
  };

  const handleEditSubmit = () => {
    if (editingReviewId && editText.trim()) {
      updateStylistReview(editingReviewId, editText, editRating);
      setEditModalOpen(false);
      setEditingReviewId(null);
    }
  };

  return (
    <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto font-body min-h-screen">
      {/* Header */}
      <section className="mb-unit-lg text-center md:text-left">
        <p className="text-primary font-label-md text-xs uppercase tracking-widest mb-2 font-bold font-mono">Feedback</p>
        <h2 className="font-headline text-3xl md:text-5xl text-on-surface">Reviews & Ratings</h2>
        <p className="text-on-surface-variant font-body text-xs md:text-sm mt-1 max-w-xl">
          Check out public testimonials of our stylist specialists or manage your submitted feedback reports.
        </p>
      </section>

      {/* Tabs */}
      <section className="mb-8 flex flex-col items-center justify-between border-b border-white/5 pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center md:justify-start w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="testimonials" className="w-1/2 sm:w-44">Public Testimonials</TabsTrigger>
              <TabsTrigger value="myreviews" className="w-1/2 sm:w-44">My Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
          </div>

          {/* --- TESTIMONIALS TAB --- */}
          <TabsContent value="testimonials" className="mt-8">
            {/* Category Filter Chips & Sort Dropdown */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center mb-6">
              {/* Category horizontal scroll pill tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar w-full md:w-auto -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-primary text-on-primary shadow-md'
                        : 'bg-surface-container border border-white/5 text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="relative md:w-44 self-end md:self-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none w-full bg-surface-container border border-white/5 rounded-xl px-4 py-2.5 pr-8 text-xs text-on-surface-variant hover:text-on-surface focus:outline-none focus:border-primary/50 font-bold uppercase tracking-wider cursor-pointer"
                >
                  <option value="Newest">Newest First</option>
                  <option value="Highest">Highest Rated</option>
                  <option value="Lowest">Lowest Rated</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
                  expand_more
                </span>
              </div>
            </div>

            {/* Testimonials Masonry Grid layout */}
            {sortedTestimonials.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center bg-white/[0.01]">
                <p className="text-xs text-on-surface-variant">No testimonials match your category filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
                {sortedTestimonials.map((item) => (
                  <Card key={item.id} className="border border-white/5 bg-white/[0.01] hover:border-primary/20 transition-all duration-300">
                    <CardContent className="p-6 space-y-4">
                      {/* Review User info */}
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3 items-center">
                          <img
                            src={item.clientAvatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmuejnO-gHxPXCNlnjGXmSutKUyizZrwrh7MGA8rhyzRp-26DwVNIwYYuqe0IiOA6wbNfXepV5BtU4o8aephTUq8qVQk4ICurPWq9G49HgtJBZRWRgpVB3VyZtKCSUOxLakakllY1c53d-YOOzNFs5NJSKt7WangVHaec8xPXC-ekRL3-evCbGP0ZhXAoIvxHMXmPHRxlXBttjx7myesKrtV4v7qoKcdjMUd88YOC5cSvnLMhxJ1O3gJhDulG4nsPc97eb1EbObw'}
                            alt={item.clientName}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                          <div>
                            <h5 className="font-bold text-xs text-on-surface">{item.clientName}</h5>
                            <span className="text-[9px] text-on-surface-variant block mt-0.5">
                              {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex text-primary">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`material-symbols-outlined text-[15px] ${
                                i < item.rating ? 'fill-current' : 'text-white/10'
                              }`}
                            >
                              star
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Service tags */}
                      <div className="flex flex-wrap gap-2">
                        {item.serviceTag && (
                          <Badge variant="gold" className="text-[8px] px-2 py-0">
                            {item.serviceTag}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[8px] px-2 py-0 font-bold uppercase flex items-center gap-1">
                          {item.barberName?.toLowerCase().startsWith('dr.') ? 'Doctor:' : 'Stylist:'} {item.barberName}
                        </Badge>
                      </div>

                      {/* Content quote */}
                      <p className="text-xs text-on-surface-variant leading-relaxed italic">
                        "{item.text}"
                      </p>

                      {/* Uploaded mock images */}
                      {item.images && item.images.length > 0 && (
                        <div className="flex gap-2 pt-1">
                          {item.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt="Review attachments"
                              className="w-12 h-12 object-cover rounded-lg border border-white/5"
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* --- MY REVIEWS TAB --- */}
          <TabsContent value="myreviews" className="mt-8">
            {reviews.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center bg-white/[0.01]">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">rate_review</span>
                <p className="text-xs text-on-surface-variant">You have not submitted any reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((item: StylistReview) => (
                  <Card key={item.id} className="border border-white/5 bg-white/[0.01]">
                    <CardContent className="p-6 flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-3 flex-grow">
                        <div className="flex justify-between items-start sm:justify-start sm:gap-4 flex-wrap gap-2">
                          <h4 className="font-headline font-bold text-base text-on-surface">
                            {item.serviceTag}
                          </h4>
                          <span className="text-[10px] text-on-surface-variant font-semibold">
                            with {item.barberName} on {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        </div>

                        {/* Stars display */}
                        <div className="flex text-primary">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`material-symbols-outlined text-[16px] ${
                                i < item.rating ? 'fill-current' : 'text-white/10'
                              }`}
                            >
                              star
                            </span>
                          ))}
                        </div>

                        <p className="text-xs text-on-surface-variant leading-relaxed">
                          {item.text}
                        </p>
                      </div>

                      {/* Edit/Delete Actions */}
                      <div className="flex sm:flex-col gap-2 items-center justify-end sm:justify-start">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-28 flex items-center justify-center gap-1"
                          onClick={() => handleEditClick(item)}
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-28 flex items-center justify-center gap-1"
                          onClick={() => deleteStylistReview(item.id)}
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* --- POST APPOINTMENT REVIEW FORM MODAL --- */}
      <Dialog open={reviewTriggerOpen} onOpenChange={setReviewTriggerOpen}>
        {targetApt && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>How was your experience?</DialogTitle>
              <DialogDescription>
                Rate your Completed session for <span className="text-primary font-bold">{targetApt.serviceName}</span> with <span className="text-primary font-bold">{targetApt.barberName}</span>.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleReviewSubmit} className="space-y-4 mt-2">
              {/* Overall Star rating selector */}
              <div className="space-y-1 text-center py-2">
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-extrabold mb-1">
                  Overall Rating
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setOverallRating(star)}
                      className="text-primary hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                    >
                      <motion.span
                        whileTap={{ scale: 0.9 }}
                        className={`material-symbols-outlined text-3xl ${overallRating >= star ? 'fill-current' : ''}`}
                      >
                        star
                      </motion.span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-ratings */}
              <div className="grid grid-cols-3 gap-3 bg-white/[0.01] border border-white/5 p-3 rounded-xl text-center">
                {/* Service Quality */}
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-on-surface-variant font-bold block">Service Quality</span>
                  <div className="flex justify-center text-primary">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        onClick={() => setQualityRating(i)}
                        className={`material-symbols-outlined text-[13px] cursor-pointer ${
                          qualityRating >= i ? 'fill-current' : 'text-white/10'
                        }`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stylist */}
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-on-surface-variant font-bold block">Stylist Skill</span>
                  <div className="flex justify-center text-primary">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        onClick={() => setStylistRating(i)}
                        className={`material-symbols-outlined text-[13px] cursor-pointer ${
                          stylistRating >= i ? 'fill-current' : 'text-white/10'
                        }`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cleanliness */}
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-wider text-on-surface-variant font-bold block">Cleanliness</span>
                  <div className="flex justify-center text-primary">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span
                        key={i}
                        onClick={() => setCleanlinessRating(i)}
                        className={`material-symbols-outlined text-[13px] cursor-pointer ${
                          cleanlinessRating >= i ? 'fill-current' : 'text-white/10'
                        }`}
                      >
                        star
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Text review comments */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                  <span>Comments</span>
                  <span className={reviewText.length > 500 ? 'text-red-400 font-bold' : ''}>
                    {reviewText.length}/500
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Describe your grooming experience..."
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 font-body placeholder:text-on-surface-variant/30"
                  required
                />
              </div>

              {/* Mock photo attachment */}
              <div className="space-y-2">
                <span className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                  Attach Grooming Photos (Max 3)
                </span>
                <div className="flex gap-2 items-center">
                  <div
                    onClick={handlePhotoClick}
                    className="w-12 h-12 border border-dashed border-white/15 hover:border-primary/30 rounded-lg flex flex-col items-center justify-center cursor-pointer bg-white/[0.01]"
                  >
                    <span className="material-symbols-outlined text-primary text-[18px]">add_a_photo</span>
                  </div>

                  {photoPlaceholder.map((url, index) => (
                    <div key={index} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10">
                      <img src={url} alt="thumbnail" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoPlaceholder(prev => prev.filter((_, idx) => idx !== index))}
                        className="absolute top-0.5 right-0.5 bg-black/60 rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-black/90"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter className="pt-4 flex gap-2 justify-end">
                <Button variant="outline" type="button" onClick={() => setReviewTriggerOpen(false)}>
                  Skip Review
                </Button>
                <Button type="submit" disabled={isSubmitting || reviewText.trim().length === 0}>
                  Submit Review
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* --- EDIT REVIEW DIALOG MODAL --- */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Review Comments</DialogTitle>
            <DialogDescription>Modify your rating score or feedback statement below.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Stars */}
            <div className="space-y-1 text-center">
              <span className="block text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Rating Score</span>
              <div className="flex justify-center gap-1.5 text-primary">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setEditRating(star)}
                    className={`material-symbols-outlined text-2xl cursor-pointer ${editRating >= star ? 'fill-current' : 'text-white/10'}`}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-1.5">
              <label className="block text-[9px] uppercase tracking-wider text-on-surface-variant font-bold">Feedback Details</label>
              <textarea
                rows={4}
                maxLength={500}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 font-body"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Save Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default ReviewsPage;

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/shared/context/AuthContext";
import { API_BASE, extractDirectImageUrl } from "@/shared/utils/api";

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=600';

const resolveProductImage = (src, updatedAt) => {
  if (!src) return DEFAULT_PRODUCT_IMAGE;
  const cleanSrc = extractDirectImageUrl(src);
  if (!cleanSrc) return DEFAULT_PRODUCT_IMAGE;
  if (cleanSrc.startsWith('data:') || (cleanSrc.startsWith('http') && !cleanSrc.includes('localhost:5000'))) return cleanSrc;
  let resolved = cleanSrc;
  const uploadsIdx = cleanSrc.indexOf('uploads');
  if (uploadsIdx !== -1) {
    const relativePath = cleanSrc.substring(uploadsIdx).replace(/\\/g, '/');
    resolved = `${API_BASE}/${relativePath}`;
  } else if (cleanSrc.startsWith('/')) {
    resolved = `${API_BASE}${cleanSrc}`;
  }
  if (updatedAt) {
    const version = new Date(updatedAt).getTime();
    return `${resolved}?v=${version}`;
  }
  return resolved;
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const carouselProducts = [
    {
      name: 'Radiance Glow Serum',
      category: 'Skincare',
      price: '₹1,450',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
      tag: 'Bestseller'
    },
    {
      name: 'Premium Beard Oil',
      category: 'Beard Care',
      price: '₹1,200',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
      tag: 'Popular'
    },
    {
      name: 'Keratin Repair Mask',
      category: 'Hair Care',
      price: '₹1,600',
      image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=800&auto=format&fit=crop',
      tag: 'Luxury'
    },
    {
      name: 'Matte Clay Wax',
      category: 'Hair Styling',
      price: '₹950',
      image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=800&auto=format&fit=crop',
      tag: 'Popular'
    },
    {
      name: 'Hydrating Botanical Mist',
      category: 'Skincare',
      price: '₹850',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop',
      tag: 'Organic'
    },
    {
      name: 'Signature Pomade',
      category: 'Hair Styling',
      price: '₹1,050',
      image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=800&auto=format&fit=crop',
      tag: 'Classic'
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev === carouselProducts.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [carouselProducts.length]);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-body overflow-x-hidden">
      
      {/* --- NAVIGATION BAR --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-surface/90 backdrop-blur-md border-white/10 shadow-2xl py-3' 
          : 'bg-transparent border-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 rounded bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(242,202,80,0.3)]">
              <span className="material-symbols-outlined text-on-primary font-bold">diamond</span>
            </div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-headline-md font-headline-md font-bold text-primary tracking-widest hidden sm:block">LUXE GROOM</h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/25">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Unisex Salon
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            <button 
              onClick={() => navigate('/clinical-services')}
              className="text-label-sm font-label-sm text-amber-300 hover:text-amber-200 transition-colors uppercase tracking-widest cursor-pointer flex items-center gap-1 font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">diamond</span> Clinical Services
            </button>
            {['About', 'Contact'].map(item => (
              <button 
                key={item} 
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-label-sm font-label-sm text-on-surface hover:text-primary transition-colors uppercase tracking-widest cursor-pointer"
              >
                {item}
              </button>
            ))}
            <button 
              onClick={() => navigate('/shop')}
              className="text-label-sm font-label-sm text-on-surface hover:text-primary transition-colors uppercase tracking-widest cursor-pointer"
            >
              Shop
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-5 py-2 rounded-lg text-label-sm font-label-sm text-primary hover:text-primary/80 transition-colors uppercase tracking-widest cursor-pointer font-bold border border-primary/20 bg-primary/5"
              >
                Dashboard
              </button>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                className="px-5 py-2 rounded-lg text-label-sm font-label-sm text-on-surface hover:text-primary transition-colors uppercase tracking-widest cursor-pointer"
              >
                Sign In
              </button>
            )}
            <button 
              onClick={() => navigate('/book-appointment')}
              className="px-6 py-2.5 rounded-lg bg-primary text-on-primary font-bold text-label-sm uppercase tracking-widest shadow-[0_0_15px_rgba(242,202,80,0.3)] hover:shadow-[0_0_25px_rgba(242,202,80,0.5)] transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            >
              Book Now
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden text-primary p-2 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-symbols-outlined text-3xl">{mobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-surface-container-high/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
            >
              <div className="flex flex-col p-6 space-y-6">
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/clinical-services');
                  }}
                  className="text-left text-label-md font-bold text-amber-300 hover:text-amber-200 transition-colors uppercase tracking-widest flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">diamond</span> Clinical Services
                </button>
                {['About', 'Contact'].map(item => (
                  <button 
                    key={item} 
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="text-left text-label-md font-bold text-on-surface hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    {item}
                  </button>
                ))}
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/shop');
                  }}
                  className="text-left text-label-md font-bold text-on-surface hover:text-primary transition-colors uppercase tracking-widest"
                >
                  Shop
                </button>
                <div className="h-px bg-white/10 w-full my-2"></div>
                {user ? (
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/dashboard');
                    }}
                    className="text-left text-label-md font-bold text-primary uppercase tracking-widest"
                  >
                    Dashboard
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="text-left text-label-md font-bold text-primary uppercase tracking-widest"
                  >
                    Sign In
                  </button>
                )}

                <button 
                  onClick={() => navigate('/book-appointment')}
                  className="w-full py-3 mt-4 rounded-lg bg-primary text-on-primary font-bold text-label-md uppercase tracking-widest shadow-[0_0_15px_rgba(242,202,80,0.3)]"
                >
                  Book Appointment
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative py-20 md:py-28 flex items-center justify-center pt-44 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2070&auto=format&fit=crop" 
            alt="Luxe Groom Salon Interior" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 text-center w-full">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            {/* Unisex Distinction Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/35 text-primary text-xs md:text-sm font-bold uppercase tracking-widest mb-6 backdrop-blur-md shadow-lg shadow-primary/10">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span>Premier Unisex Salon & Spa • For Men & Women</span>
            </div>

            <p className="text-primary font-label-md text-xs md:text-sm uppercase tracking-[0.3em] font-bold mb-4">
              Experience the Epitome of Unisex Grooming & Styling
            </p>
            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl text-on-surface font-black leading-tight tracking-tight mb-6 drop-shadow-2xl">
              ELEVATE YOUR <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-primary">SIGNATURE LOOK</span>
            </h1>

            <p className="text-on-surface-variant text-base md:text-lg max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
              Bespoke haircuts, couture coloring, luxury facials, and executive grooming tailored specifically for women, men, and all styles.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <button 
                onClick={() => navigate('/book-appointment')}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-primary text-on-primary font-bold text-label-md uppercase tracking-widest shadow-[0_0_20px_rgba(242,202,80,0.4)] hover:shadow-[0_0_35px_rgba(242,202,80,0.6)] transition-all cursor-pointer hover:-translate-y-1"
              >
                Book Appointment
              </button>
              <button 
                onClick={() => navigate('/services')}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-surface-container border border-white/20 text-on-surface font-bold text-label-md uppercase tracking-widest hover:border-primary hover:bg-white/5 transition-all cursor-pointer"
              >
                Explore Services
              </button>
            </div>

            {/* --- SHOP ADVERTISEMENT CAROUSEL --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mt-20 text-left">
              
              {/* Left Content */}
              <div className="lg:col-span-5">
                <span className="text-primary font-bold text-xs uppercase tracking-[0.3em] block mb-3">Premium Grooming Essentials</span>
                <h2 className="font-headline text-3xl md:text-4xl text-on-surface font-bold mb-6 leading-tight">
                  BRING THE LUXE EXPERIENCE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-primary">HOME</span>
                </h2>
                
                <button 
                  onClick={() => navigate('/shop')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-on-primary font-bold text-sm uppercase tracking-widest shadow-[0_0_15px_rgba(242,202,80,0.3)] hover:shadow-[0_0_25px_rgba(242,202,80,0.5)] transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 text-center"
                >
                  Shop All Products
                </button>
              </div>

              {/* Right Product Showcase Carousel */}
              <div className="lg:col-span-7 w-full relative overflow-hidden px-1">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs text-on-surface-variant uppercase tracking-wider font-bold">Featured Catalog</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCarouselIndex((prev) => (prev === 0 ? carouselProducts.length - 1 : prev - 1))}
                      className="w-10 h-10 rounded-full bg-surface-container border border-white/10 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button 
                      onClick={() => setCarouselIndex((prev) => (prev === carouselProducts.length - 1 ? 0 : prev + 1))}
                      className="w-10 h-10 rounded-full bg-surface-container border border-white/10 flex items-center justify-center text-on-surface hover:text-primary hover:border-primary transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
                
                <div className="overflow-hidden w-full rounded-2xl">
                  <motion.div 
                    className="flex"
                    animate={{ x: `-${carouselIndex * 100}%` }}
                    transition={{ type: "tween", ease: "easeInOut", duration: 1.0 }}
                  >
                    {carouselProducts.map((prod, idx) => (
                      <div 
                        key={idx}
                        onClick={() => navigate('/shop')}
                        className="w-full flex-shrink-0 group relative bg-surface-container rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex flex-col"
                      >
                        {/* Cover Image Frame */}
                        <div className="h-44 sm:h-48 relative overflow-hidden bg-surface-container-high">
                          <img 
                            referrerPolicy="no-referrer"
                            src={resolveProductImage(prod.image, prod.updatedAt)} 
                            alt={prod.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              if (e.target.src !== DEFAULT_PRODUCT_IMAGE) {
                                e.target.src = DEFAULT_PRODUCT_IMAGE;
                              }
                            }}
                          />
                          <div className="absolute top-3 left-3 bg-primary text-on-primary text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                            {prod.tag}
                          </div>
                        </div>

                        {/* Content Box */}
                        <div className="p-4 flex flex-col justify-between flex-grow text-left">
                          <div>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">
                              {prod.category}
                            </span>
                            <h4 className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors leading-tight mb-2">
                              {prod.name}
                            </h4>
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                            <span className="font-headline font-bold text-primary text-base">{prod.price}</span>
                            <span className="text-xs text-on-surface-variant flex items-center gap-1 group-hover:text-primary transition-colors">
                              View Product <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>

                {/* Indicators */}
                <div className="flex justify-center gap-2 mt-6">
                  {carouselProducts.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        carouselIndex === idx ? 'w-8 bg-primary' : 'w-2.5 bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* --- UNISEX EXPERIENCES SECTION --- */}
      <section className="py-20 bg-surface/50 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold uppercase tracking-widest mb-4">
              <span className="material-symbols-outlined text-base">wc</span> Tailored For Everyone
            </div>
            <h2 className="font-headline text-3xl md:text-5xl text-on-surface font-bold tracking-tight mb-4">
              Luxury Salon Care for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-primary">Women & Men</span>
            </h2>
            <p className="text-on-surface-variant text-base md:text-lg leading-relaxed">
              Experience the pinnacle of personal care. Our unisex salon features dedicated master stylists, certified beauty therapists, and private suites for all styling needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: For Her */}
            <div className="group relative rounded-2xl bg-surface-container border border-white/5 hover:border-pink-400/40 transition-all p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-36 h-36 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-colors pointer-events-none"></div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl">spa</span>
                </div>
                <span className="text-[11px] font-bold text-pink-400 uppercase tracking-widest block mb-1">For Women</span>
                <h3 className="font-headline text-2xl font-bold text-on-surface mb-3">Couture Hair & Beauty</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Balayage & creative color artistry, keratin therapies, bridal & gala makeovers, hydra-derm facials, and luxury nail styling.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['Hair Artistry', 'Hydra Facial', 'Bridal Glam', 'Nail Bar'].map((tag, i) => (
                    <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/5 text-on-surface-variant border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => navigate('/services')}
                className="w-full py-2.5 rounded-lg border border-pink-500/30 text-pink-300 hover:bg-pink-500/10 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Explore Women's Services <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Card 2: For Him */}
            <div className="group relative rounded-2xl bg-surface-container border border-white/5 hover:border-amber-400/40 transition-all p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors pointer-events-none"></div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl">content_cut</span>
                </div>
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block mb-1">For Men</span>
                <h3 className="font-headline text-2xl font-bold text-on-surface mb-3">Precision Grooming</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Bespoke scissor & skin fade cuts, hot towel shaves, beard sculpting, scalp detox therapy, and executive facials.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['Master Fades', 'Beard Sculpting', 'Hot Towel', 'Scalp Detox'].map((tag, i) => (
                    <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/5 text-on-surface-variant border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => navigate('/services')}
                className="w-full py-2.5 rounded-lg border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Explore Men's Services <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Card 3: Unisex & Wellness */}
            <div className="group relative rounded-2xl bg-surface-container border border-white/5 hover:border-emerald-400/40 transition-all p-6 md:p-8 flex flex-col justify-between overflow-hidden shadow-xl hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors pointer-events-none"></div>
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-2xl">self_improvement</span>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Unisex Wellness</span>
                <h3 className="font-headline text-2xl font-bold text-on-surface mb-3">Skin & Scalp Spa</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Clinical skin treatments, therapeutic head massotherapy, deep moisturizing hair spas, and organic relaxation therapies.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['Clinical Skin', 'Aromatherapy', 'Deep Hair Spa', 'Body Polishing'].map((tag, i) => (
                    <span key={i} className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-white/5 text-on-surface-variant border border-white/5">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => navigate('/services')}
                className="w-full py-2.5 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Explore Wellness Services <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- WHY CHOOSE US SECTION --- */}
      <section id="about" className="py-24 bg-surface-container-high border-y border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]"></div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-headline text-3xl md:text-5xl text-on-surface font-bold mb-6">The Luxe Standard</h2>
              <p className="text-on-surface-variant text-lg mb-8 leading-relaxed">
                We believe grooming and beauty are elevated art forms. As an all-inclusive unisex salon, we bring together award-winning women's stylists and master barbers to deliver an unparalleled experience tailored to you.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: 'Master Stylists for Men & Women', desc: 'Our team consists of dedicated specialists in women’s hair couture, bridal beauty, and classic men’s precision grooming.', icon: 'award_star' },
                  { title: 'Premium Formulations', desc: 'We exclusively use high-end, organic, and dermatologist-tested hair and skincare products for all clients.', icon: 'water_drop' },
                  { title: 'Private & Luxury Ambience', desc: 'Relax in our bespoke styling suites with private booths, complimentary beverages, and hot towels.', icon: 'chair_alt' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                    </div>
                    <div>
                      <h4 className="font-headline text-lg font-bold text-on-surface mb-1">{item.title}</h4>
                      <p className="text-sm text-on-surface-variant">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[600px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
            >
              <img src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=1000&auto=format&fit=crop" alt="Barber at work" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
              <div className="absolute bottom-10 left-10 right-10 bg-surface/80 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex text-primary">
                    {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined text-xl">star</span>)}
                  </div>
                  <span className="font-bold text-on-surface">4.9/5 Rating</span>
                </div>
                <p className="text-sm text-on-surface-variant">Trusted by over 5,000 discerning clients across the city.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* --- CTA SECTION --- */}
      <section className="py-32 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2000&auto=format&fit=crop" alt="CTA Background" className="w-full h-full object-cover opacity-30 blur-sm" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>
        <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
          <h2 className="font-headline text-4xl md:text-6xl text-on-surface font-black mb-6">Ready to look your best?</h2>
          <p className="text-on-surface-variant text-lg mb-10">Join thousands of women and men who trust our unisex salon with their signature look.</p>
          <button 
            onClick={() => navigate('/book-appointment')}
            className="px-12 py-5 rounded-xl bg-primary text-on-primary font-bold text-label-md uppercase tracking-widest shadow-[0_0_20px_rgba(242,202,80,0.4)] hover:shadow-[0_0_40px_rgba(242,202,80,0.7)] hover:scale-105 transition-all cursor-pointer"
          >
            Book Your Appointment Now
          </button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer id="contact" className="bg-surface-container-highest border-t border-white/10 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary font-bold text-sm">diamond</span>
              </div>
              <h1 className="text-headline-md font-headline-md font-bold text-primary tracking-widest">LUXE GROOM</h1>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Premier unisex luxury salon and booking portal for women and men. Elevate your beauty, wellness, and grooming standards today.
            </p>
            <div className="flex gap-4">
              {['facebook', 'instagram', 'twitter'].map((social, i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-surface-container border border-white/10 flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all cursor-pointer">
                  <span className="text-xs uppercase font-bold">{social.substring(0,2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-headline font-bold text-on-surface mb-6 uppercase tracking-widest text-sm">Quick Links</h4>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li><button onClick={() => scrollToSection('services')} className="hover:text-primary transition-colors cursor-pointer">Services</button></li>
              <li><button onClick={() => scrollToSection('about')} className="hover:text-primary transition-colors cursor-pointer">About Us</button></li>
              <li><button onClick={() => scrollToSection('gallery')} className="hover:text-primary transition-colors cursor-pointer">Gallery</button></li>
              <li><button onClick={() => scrollToSection('pricing')} className="hover:text-primary transition-colors cursor-pointer">Pricing</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-headline font-bold text-on-surface mb-6 uppercase tracking-widest text-sm">Account</h4>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li><button onClick={() => navigate('/login')} className="hover:text-primary transition-colors cursor-pointer">Client Login</button></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-primary transition-colors cursor-pointer">Create Account</button></li>
              <li><button onClick={() => navigate('/book-appointment')} className="hover:text-primary transition-colors cursor-pointer">Book Appointment</button></li>

            </ul>
          </div>

          <div>
            <h4 className="font-headline font-bold text-on-surface mb-6 uppercase tracking-widest text-sm">Contact Us</h4>
            <ul className="space-y-4 text-sm text-on-surface-variant">
              <li className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                <span>Udupi</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">call</span>
                <span>+91 8431967664</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">mail</span>
                <span>hello@luxegroom.com</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                <span>Mon - Sun: 9AM - 9PM</span>
              </li>
            </ul>
          </div>
          
        </div>
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center border-t border-white/5 pt-8 text-xs text-on-surface-variant/50">
          <p>&copy; {new Date().getFullYear()} Luxe Groom Salon Management. All rights reserved.</p>
        </div>
      </footer>
      
    </div>
  );
};

export default LandingPage;

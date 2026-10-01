import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from "@/shared/context/AuthContext";
import { API_BASE } from "@/shared/utils/api";

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&q=80&w=600';

const resolveProductImage = (src, updatedAt) => {
  if (!src) return DEFAULT_PRODUCT_IMAGE;
  if (src.startsWith('data:') || (src.startsWith('http') && !src.includes('localhost:5000'))) return src;
  let resolved = src;
  const uploadsIdx = src.indexOf('uploads');
  if (uploadsIdx !== -1) {
    const relativePath = src.substring(uploadsIdx).replace(/\\/g, '/');
    resolved = `${API_BASE}/${relativePath}`;
  } else if (src.startsWith('/')) {
    resolved = `${API_BASE}${src}`;
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
      name: 'Premium Beard Oil',
      category: 'Beard Care',
      price: '₹1,200',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop',
      tag: 'Bestseller'
    },
    {
      name: 'Matte Clay Wax',
      category: 'Hair Styling',
      price: '₹950',
      image: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?q=80&w=800&auto=format&fit=crop',
      tag: 'Popular'
    },
    {
      name: 'Signature Pomade',
      category: 'Hair Styling',
      price: '₹1,050',
      image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=800&auto=format&fit=crop',
      tag: 'Classic'
    },
    {
      name: 'Invigorating Shampoo',
      category: 'Hair Care',
      price: '₹800',
      image: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?q=80&w=800&auto=format&fit=crop',
      tag: 'New'
    },
    {
      name: 'Restorative Conditioner',
      category: 'Hair Care',
      price: '₹850',
      image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?q=80&w=800&auto=format&fit=crop',
      tag: 'Hydrating'
    },
    {
      name: 'Pre-Shave Oil',
      category: 'Shaving',
      price: '₹1,100',
      image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop',
      tag: 'Luxury'
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
            <div className="w-10 h-10 rounded bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary font-bold">diamond</span>
            </div>
            <h1 className="text-headline-md font-headline-md font-bold text-primary tracking-widest hidden sm:block">LUXE GROOM</h1>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-8">
            <button 
              onClick={() => navigate('/clinical-services')}
              className="text-label-sm font-label-sm text-amber-300 hover:text-amber-200 transition-colors uppercase tracking-widest cursor-pointer flex items-center gap-1 font-bold"
            >
              <span className="material-symbols-outlined text-[16px]">diamond</span> Premium Styles
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
                  <span className="material-symbols-outlined text-[18px]">diamond</span> Premium Styles
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
            <p className="text-primary font-label-md text-sm md:text-base uppercase tracking-[0.3em] font-bold mb-6">
              Experience the Epitome of Grooming
            </p>
            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl text-on-surface font-black leading-tight tracking-tight mb-6 drop-shadow-2xl">
              ELEVATE YOUR <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-primary">SIGNATURE LOOK</span>
            </h1>
            
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
                            src={resolveProductImage(prod.image, prod.updatedAt)} 
                            alt={prod.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.target.src = DEFAULT_PRODUCT_IMAGE;
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
                We believe grooming is an art form. Our salon combines traditional barbering techniques with modern styling to deliver an unparalleled experience.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: 'Master Stylists', desc: 'Our team consists of award-winning professionals with decades of combined experience.', icon: 'award_star' },
                  { title: 'Premium Products', desc: 'We exclusively use high-end, organic grooming products to ensure the best results.', icon: 'water_drop' },
                  { title: 'Luxury Ambience', desc: 'Relax in our bespoke leather chairs with complimentary beverages and hot towels.', icon: 'chair_alt' },
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
          <p className="text-on-surface-variant text-lg mb-10">Join thousands of satisfied clients who trust us with their appearance.</p>
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
              Premium salon management system and booking portal for the modern gentleman. Elevate your grooming standards today.
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
                <span>123 Luxury Avenue,<br/>Metropolis, NY 10001</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">call</span>
                <span>+1 (555) 123-4567</span>
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

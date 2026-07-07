import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            {['Services', 'About', 'Gallery', 'Pricing', 'Contact'].map(item => (
              <button 
                key={item} 
                onClick={() => scrollToSection(item.toLowerCase())}
                className="text-label-sm font-label-sm text-on-surface hover:text-primary transition-colors uppercase tracking-widest cursor-pointer"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-5 py-2 rounded-lg text-label-sm font-label-sm text-on-surface hover:text-primary transition-colors uppercase tracking-widest cursor-pointer"
            >
              Sign In
            </button>
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
                {['Services', 'About', 'Gallery', 'Pricing', 'Contact'].map(item => (
                  <button 
                    key={item} 
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="text-left text-label-md font-bold text-on-surface hover:text-primary transition-colors uppercase tracking-widest"
                  >
                    {item}
                  </button>
                ))}
                <div className="h-px bg-white/10 w-full my-2"></div>
                <button 
                  onClick={() => navigate('/login')}
                  className="text-left text-label-md font-bold text-primary uppercase tracking-widest"
                >
                  Sign In
                </button>

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
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
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
            <h1 className="font-headline text-5xl md:text-7xl lg:text-8xl text-on-surface font-black leading-tight tracking-tight mb-8 drop-shadow-2xl">
              ELEVATE YOUR <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-primary">SIGNATURE LOOK</span>
            </h1>
            <p className="text-on-surface-variant text-base md:text-lg lg:text-xl font-body max-w-2xl mx-auto mb-10 leading-relaxed">
              Premium haircuts, precision beard sculpting, and luxury spa treatments tailored for the modern gentleman. Step into our world of refinement.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <button 
                onClick={() => navigate('/book-appointment')}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-primary text-on-primary font-bold text-label-md uppercase tracking-widest shadow-[0_0_20px_rgba(242,202,80,0.4)] hover:shadow-[0_0_35px_rgba(242,202,80,0.6)] transition-all cursor-pointer hover:-translate-y-1"
              >
                Book Appointment
              </button>
              <button 
                onClick={() => scrollToSection('services')}
                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-surface-container border border-white/20 text-on-surface font-bold text-label-md uppercase tracking-widest hover:border-primary hover:bg-white/5 transition-all cursor-pointer"
              >
                Explore Services
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 cursor-pointer text-on-surface-variant hover:text-primary transition-colors"
          onClick={() => scrollToSection('services')}
        >
          <span className="material-symbols-outlined text-4xl">keyboard_arrow_down</span>
        </motion.div>
      </section>

      {/* --- SERVICES SECTION --- */}
      <section id="services" className="py-24 relative z-10 bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-5xl text-on-surface font-bold mb-4">Our Premium Services</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6 rounded-full"></div>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Discover our range of bespoke grooming treatments, delivered by master stylists using elite products.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Master Haircut', price: '$45', icon: 'content_cut', img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop' },
              { title: 'Signature Beard Sculpt', price: '$35', icon: 'face', img: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=800&auto=format&fit=crop' },
              { title: 'The Royal Shave', price: '$55', icon: 'dry_cleaning', img: 'https://images.unsplash.com/photo-1512496115851-a1c8faca50c9?q=80&w=800&auto=format&fit=crop' },
              { title: 'Luxury Spa Facial', price: '$85', icon: 'spa', img: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=800&auto=format&fit=crop' },
              { title: 'Executive Package', price: '$120', icon: 'workspace_premium', img: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=800&auto=format&fit=crop' },
              { title: 'Hair Coloring', price: '$90', icon: 'format_paint', img: 'https://images.unsplash.com/photo-1520699697851-3dc68aa3a474?q=80&w=800&auto=format&fit=crop' },
            ].map((service, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="group rounded-2xl bg-surface-container border border-white/5 overflow-hidden hover:border-primary/50 transition-all hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] cursor-pointer flex flex-col h-full"
                onClick={() => navigate('/book-appointment')}
              >
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors z-10"></div>
                  <img src={service.img} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute bottom-4 right-4 z-20 bg-background/80 backdrop-blur-md px-3 py-1 rounded-full border border-primary/30">
                    <span className="text-primary font-bold font-headline">{service.price}</span>
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                      <span className="material-symbols-outlined">{service.icon}</span>
                    </div>
                    <h3 className="font-headline text-xl font-bold text-on-surface group-hover:text-primary transition-colors">{service.title}</h3>
                  </div>
                  <p className="text-sm text-on-surface-variant flex-grow">Experience ultimate relaxation and precision with our tailored grooming process.</p>
                  <div className="mt-6 flex items-center text-primary font-bold text-xs uppercase tracking-widest group-hover:underline">
                    Book Now <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button 
              onClick={() => navigate('/services')}
              className="px-8 py-3 rounded-lg border border-primary text-primary font-bold text-label-md uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
            >
              View Full Menu
            </button>
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

      {/* --- GALLERY SECTION --- */}
      <section id="gallery" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="font-headline text-3xl md:text-5xl text-on-surface font-bold mb-4">Inside Our Salon</h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6 rounded-full"></div>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Take a glimpse into the luxurious environment that awaits you.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-[600px]">
            <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=1000&auto=format&fit=crop" alt="Gallery 1" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="rounded-2xl overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=600&auto=format&fit=crop" alt="Gallery 2" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="rounded-2xl overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1512496115851-a1c8faca50c9?q=80&w=600&auto=format&fit=crop" alt="Gallery 3" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="col-span-2 rounded-2xl overflow-hidden group">
              <img src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1000&auto=format&fit=crop" alt="Gallery 4" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* --- PRICING HIGHLIGHTS & FAQ --- */}
      <section id="pricing" className="py-24 bg-surface-container-high border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          {/* Pricing */}
          <div>
            <h2 className="font-headline text-3xl md:text-4xl text-on-surface font-bold mb-10">Transparent Pricing</h2>
            <div className="space-y-6">
              {[
                { name: 'Haircuts', price: 'from $35', desc: 'Includes consultation, wash, cut, and styling.' },
                { name: 'Beard Grooming', price: 'from $25', desc: 'Trimming, shaping, and hot towel treatment.' },
                { name: 'Spa Facials', price: 'from $65', desc: 'Deep cleansing, exfoliation, and hydration.' },
                { name: 'Coloring', price: 'from $85', desc: 'Premium colors with deep conditioning.' },
                { name: 'Memberships', price: 'from $99/mo', desc: 'Unlimited standard cuts and priority booking.' }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-end border-b border-white/10 pb-4 group cursor-default">
                  <div>
                    <h4 className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{item.name}</h4>
                    <p className="text-sm text-on-surface-variant mt-1">{item.desc}</p>
                  </div>
                  <div className="text-primary font-bold font-headline whitespace-nowrap ml-4">
                    {item.price}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* FAQ */}
          <div>
            <h2 className="font-headline text-3xl md:text-4xl text-on-surface font-bold mb-10">Common Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'Do I need an appointment?', a: 'While walk-ins are welcome, we highly recommend booking in advance to ensure availability.' },
                { q: 'What is your cancellation policy?', a: 'We ask for at least 12 hours notice for cancellations. Late cancellations may incur a fee.' },
                { q: 'Do you offer services for children?', a: 'Yes, we offer premium grooming services for gentlemen of all ages.' },
                { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, digital wallets, and cash.' }
              ].map((faq, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-surface-container border border-white/5 hover:border-primary/30 transition-colors">
                  <h4 className="font-headline font-bold text-on-surface mb-2">{faq.q}</h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
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

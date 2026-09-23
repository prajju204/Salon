import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";
import { API_BASE } from "@/shared/utils/api";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Service } from "@/shared/types/booking";

interface ServiceCatalogProps {
  defaultCategory?: string;
}

const ServiceCatalog: React.FC<ServiceCatalogProps> = ({ defaultCategory }) => {
  const navigate = useNavigate();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(() => {
    return defaultCategory || sessionStorage.getItem('luxe_catalog_category') || 'All';
  });
  const [genderFilter, setGenderFilter] = useState('All'); // All, Male, Female, Both
  const [sortBy, setSortBy] = useState('Popular'); // Popular, PriceLowHigh, PriceHighLow, Duration
  const [isLoading, setIsLoading] = useState(true);
  const [servicesList, setServicesList] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>(['All', 'Premium Services']);

  useEffect(() => {
    if (defaultCategory) {
      setActiveTab(defaultCategory);
    }
  }, [defaultCategory]);

  // Fetch categories dynamically
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const prefix = (window.location.port === '5174' || document.title.includes('Admin')) ? `${API_BASE}/api/admin` : `${API_BASE}/api/auth`;
        const res = await axios.get(`${prefix}/services/categories`);
        if (res.data?.success) {
          const fetchedCats = res.data.data;
          if (defaultCategory === 'Premium Services' || window.location.pathname.includes('/premium-services')) {
            // When on the dedicated Premium Services page, only show Premium Services tab
            setCategories(['Premium Services']);
            setActiveTab('Premium Services');
          } else {
            // In regular services section: remove Premium Services
            const regularCats = fetchedCats.filter((c: string) => c !== 'Premium Services');
            setCategories(regularCats);
            if (activeTab === 'Premium Services') {
              setActiveTab('All');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        if (defaultCategory === 'Premium Services' || window.location.pathname.includes('/premium-services')) {
          setCategories(['Premium Services']);
        }
      }
    };
    fetchCategories();
  }, [defaultCategory]);

  // Fetch services based on selected category tab
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const prefix = (window.location.port === '5174' || document.title.includes('Admin')) ? `${API_BASE}/api/admin` : `${API_BASE}/api/auth`;
        const res = await axios.get(`${prefix}/services`, {
          params: { category: activeTab }
        });
        if (res.data?.success) {
          setServicesList(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
    sessionStorage.setItem('luxe_catalog_category', activeTab);
  }, [activeTab]);

  // Handle Book Service click
  const handleBookClick = (serviceId: string) => {
    navigate('/book-appointment', { state: { serviceId } });
  };

  // Filter & Sort Logic (Local Search and Sorting of backend-filtered services)
  const isPremiumPage = defaultCategory === 'Premium Services' || window.location.pathname.includes('/premium-services');
  const filteredServices = servicesList.filter((service) => {
    const name = service?.name || '';
    const desc = service?.description || '';

    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      desc.toLowerCase().includes(searchTerm.toLowerCase());
    const isActive = service?.status !== 'Inactive';
    if (!isPremiumPage && service?.category === 'Premium Services') {
      return false; // Remove premium from regular services section
    }

    // Strict Gender & Category Filtering
    if (genderFilter === 'Male') {
      // For male users: show only Haircut, Beard Trim, Facial, and Packages. Prevent any women's services/styles from appearing!
      const isWomens = service?.gender === 'Female' || service?.category === 'Hair Style' || service?.category === "Women's Styles";
      if (isWomens) return false;
      if (service?.category === 'Packages' && service?.gender !== 'Male') return false;
      const allowedMaleCategories = ['Haircut', 'Haircuts', 'Beard Trim', 'Beard', 'Facial', 'Facials', 'Packages', 'Premium Services'];
      if (service?.category && !allowedMaleCategories.includes(service.category)) return false;
    } else if (genderFilter === 'Female') {
      // For female users: show only Women's Styles, female or unisex services. Prevent men's only services (Beard Trim/Beard/Male Haircuts)
      const isMensOnly = service?.gender === 'Male' || service?.category === 'Beard Trim' || service?.category === 'Beard' || service?.category === 'Haircut' || service?.category === 'Haircuts';
      if (isMensOnly) return false;
      if (service?.category === 'Packages' && service?.gender !== 'Female') return false;
    }

    return isActive && matchesSearch;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    if (sortBy === 'PriceLowHigh') {
      return (a.price || 0) - (b.price || 0);
    }
    if (sortBy === 'PriceHighLow') {
      return (b.price || 0) - (a.price || 0);
    }
    if (sortBy === 'Duration') {
      return (a.duration || 0) - (b.duration || 0);
    }
    const idA = a?.id || a?._id || '';
    const idB = b?.id || b?._id || '';
    return idA.localeCompare(idB);
  });

  const isPremiumView = defaultCategory === 'Premium Services' || window.location.pathname.includes('/premium-services');

  return (
    <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto font-body min-h-screen">
      {/* Top Banner Header */}
      <section className="mb-unit-lg text-center md:text-left">
        <p className="text-primary font-label-md text-xs uppercase tracking-widest mb-2 font-bold flex items-center justify-center md:justify-start gap-1.5">
          {isPremiumView && <span className="material-symbols-outlined text-[16px]">diamond</span>}
          {isPremiumView ? 'VIP Clinical & Surgical Menu' : 'Luxe Menu'}
        </p>
        <h2 className="font-headline text-3xl md:text-5xl text-on-surface mb-3">
          {isPremiumView ? 'Premium Styles & Clinical Treatments' : 'Our Grooming Services'}
        </h2>
        <p className="text-on-surface-variant font-body text-xs md:text-sm max-w-2xl">
          {isPremiumView 
            ? 'Exclusive, doctor-supervised clinical treatments, advanced scalp restorations, and premium restorative hair therapies.'
            : 'Indulge in our curated catalog of elite hair, beard, facial, and combination services. Sculpted with precision, delivered with luxury.'}
        </p>
      </section>

      {/* Filter and Search Bar */}
      <section className="mb-8 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-white/5 pb-6">
        {/* Horizontal scrollable category pill tabs on mobile - only show on general catalog */}
        {!isPremiumView ? (
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar w-full md:w-auto -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
            {categories
              .filter(cat => {
                if (genderFilter === 'Male') {
                  return cat !== 'Hair Style' && cat !== "Women's Styles";
                }
                if (genderFilter === 'Female') {
                  return cat !== 'Beard Trim' && cat !== 'Beard' && cat !== 'Haircut' && cat !== 'Haircuts';
                }
                return true;
              })
              .map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-5 py-2.5 rounded-full font-label-md text-[11px] uppercase tracking-wider font-bold whitespace-nowrap transition-all duration-300 transform active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === cat
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105'
                    : 'bg-surface-container border border-white/5 text-on-surface-variant hover:border-primary/30 hover:text-on-surface'
                }`}
              >
                {cat === 'Premium Services' && <span className="material-symbols-outlined text-[14px]">diamond</span>}
                {cat}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 text-amber-300 font-label-md text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 shadow-md">
              <span className="material-symbols-outlined text-[15px]">diamond</span> Premium Treatments Only
            </span>
          </div>
        )}

        {/* Search Input, Gender Filter & Sort Selector */}
        <div className="flex gap-3 items-center w-full md:w-auto flex-wrap">
          <div className="relative flex-grow md:flex-grow-0 md:w-56">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface-container border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/50 font-body transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-white"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          <div className="relative">
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="appearance-none bg-surface-container border border-white/5 rounded-xl px-4 py-2.5 pr-8 text-xs text-on-surface-variant hover:text-on-surface focus:outline-none focus:border-primary/50 font-bold uppercase tracking-wider cursor-pointer"
            >
              <option value="All">All Genders</option>
              <option value="Male">Men's (Male) ♂</option>
              <option value="Female">Women's (Female) ♀</option>
              <option value="Both">Unisex Only ⚧</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-surface-container border border-white/5 rounded-xl px-4 py-2.5 pr-8 text-xs text-on-surface-variant hover:text-on-surface focus:outline-none focus:border-primary/50 font-bold uppercase tracking-wider cursor-pointer"
            >
              <option value="Popular">Popular</option>
              <option value="PriceLowHigh">Price: Low → High</option>
              <option value="PriceHighLow">Price: High → Low</option>
              <option value="Duration">Duration</option>
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
              expand_more
            </span>
          </div>
        </div>
      </section>

      {/* Grid Content */}
      {isLoading ? (
        // Skeleton loader grid
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden border border-white/5">
              <div className="h-48 bg-surface-container-highest animate-pulse" />
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="h-6 w-2/3 bg-surface-container-highest rounded animate-pulse" />
                  <div className="h-6 w-1/4 bg-surface-container-highest rounded animate-pulse" />
                </div>
                <div className="h-4 w-1/2 bg-surface-container-highest rounded animate-pulse" />
                <div className="h-12 w-full bg-surface-container-highest rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : sortedServices.length === 0 ? (
        // Empty Search Results
        <section className="py-20 text-center glass-panel rounded-2xl border border-white/5 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mx-auto mb-4 border border-white/5">
            <span className="material-symbols-outlined text-3xl text-on-surface-variant">search_off</span>
          </div>
          <h3 className="font-headline text-2xl text-on-surface mb-2">No Services Found</h3>
          <p className="text-on-surface-variant text-xs mb-6">
            We couldn't find any services matching your search criteria. Try modifying your filters or search keywords.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setGenderFilter('All');
              setActiveTab('All');
            }}
          >
            Clear Filters
          </Button>
        </section>
      ) : (
        // Active Services Grid
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {sortedServices.map((service) => (
            <Card key={service.id || service._id} className="group overflow-hidden flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
              <div>
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    {service.category === 'Premium Services' && (
                      <div className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">diamond</span> LUXE VIP
                      </div>
                    )}
                    <div className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shadow-lg backdrop-blur-md border ${
                      service.gender === 'Female'
                        ? 'bg-pink-950/80 text-pink-300 border-pink-500/40'
                        : service.gender === 'Male'
                        ? 'bg-blue-950/80 text-blue-300 border-blue-500/40'
                        : 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                    }`}>
                      {service.gender === 'Female' ? '♀ Female' : service.gender === 'Male' ? '♂ Male' : '⚧ Unisex'}
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-5">
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h3 className="font-headline text-lg text-on-surface group-hover:text-primary transition-colors duration-200">
                      {service.name}
                    </h3>
                    <span className="text-md font-headline font-bold text-primary whitespace-nowrap">
                      {formatCurrency(service.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-on-surface-variant/70 text-[10px] uppercase font-bold tracking-wider mb-3">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>{service.duration} min</span>
                    <span className="mx-1.5 text-white/10">•</span>
                    <span className="material-symbols-outlined text-[14px]">{service.icon || 'content_cut'}</span>
                    <span>{service.category}</span>
                  </div>

                  <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                </CardContent>
              </div>

              <div className="px-5 pb-5">
                <Button
                  onClick={() => handleBookClick(service.id || service._id)}
                  className="w-full py-3"
                >
                  Book Service
                </Button>
              </div>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
};

export default ServiceCatalog;

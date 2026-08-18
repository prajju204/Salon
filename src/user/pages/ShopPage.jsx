import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/shared/context/AppContext';
import { useAuth } from '@/shared/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import axios from 'axios';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}`;
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

const ShopPage = () => {
  const { products, giftCardBalance, createProductOrder, orders } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All Products');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState(null); // Store single item for "Buy Now"
  
  // Payment methods: 'Dummy Gateway', 'Digital Wallet', 'Cash on Delivery'
  const [paymentMethod, setPaymentMethod] = useState('Dummy Gateway'); 
  const [dummyMethod, setDummyMethod] = useState('Card'); // 'Card', 'UPI', 'Netbanking'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Card Payment States
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI QR Code States
  const [upiId, setUpiId] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);

  // Netbanking Account Details
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Reviews States
  const [activeReviewProduct, setActiveReviewProduct] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showViewReviewsDialog, setShowViewReviewsDialog] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const [paymentStatusText, setPaymentStatusText] = useState('Initializing secure payment...');

  // Prefill user details
  useEffect(() => {
    if (user) {
      setUpiId(user.email ? `${user.email.split('@')[0]}@okhdfcbank` : 'client@luxe');
    }
  }, [user]);

  const categories = ['All Products', 'Hair Styling', 'Hair Care', 'Beard Care', 'Shaving'];

  const filteredProducts = selectedCategory === 'All Products'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (product) => {
    setCart((prevCart) => {
      const exists = prevCart.find((item) => item.id === product.id);
      if (exists) {
        toast.success(`Updated ${product.name} quantity in cart.`);
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      toast.success(`Added ${product.name} to cart.`);
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    toast.info('Item removed from cart.');
  };

  const activeCheckoutItems = checkoutItem ? [checkoutItem] : cart;
  const subtotal = activeCheckoutItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const tax = Math.round(subtotal * 0.18); // 18% GST
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setCheckoutItem(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleBuyNow = (product) => {
    setCheckoutItem({ ...product, quantity: 1 });
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    if (!isProcessingPayment) {
      setIsCheckoutOpen(false);
      setCheckoutItem(null);
      setShowQrCode(false);
    }
  };

  // Card formatting helpers
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.replace(/(.{4})/g, '$1 ').trim();
    if (formatted.length <= 19) setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }
    if (value.length <= 5) setCardExpiry(value);
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 3) setCardCvv(value);
  };

  const executeOrder = async (finalMethod) => {
    setIsProcessingPayment(true);

    const stages = [
      'Sending payment request to server...',
      'Verifying security token...',
      'Deducting account ledger...',
      'Finalizing product order...'
    ];

    stages.forEach((stage, index) => {
      setTimeout(() => {
        setPaymentStatusText(stage);
      }, index * 600);
    });

    setTimeout(async () => {
      try {
        const orderData = {
          items: activeCheckoutItems.map((item) => ({
            productId: item.id || item._id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1,
            image: item.image
          })),
          totalAmount: total,
          paymentMethod: finalMethod,
          paymentStatus: finalMethod === 'Cash on Delivery' ? 'Pending' : 'Paid'
        };

        const res = await createProductOrder(orderData);
        setIsProcessingPayment(false);
        setIsCheckoutOpen(false);
        setCheckoutItem(null);
        setShowQrCode(false);
        if (!checkoutItem) setCart([]);

        if (res?.sessionExpired) {
          alert("Your payment was successful. Please sign in again to continue.");
          await logout();
          navigate('/login');
          return;
        }

        // Celebration Confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        toast.success(`Success! Order placed via ${finalMethod}.`);
        navigate('/orders');
      } catch (err) {
        setIsProcessingPayment(false);
        const isSessionExpired = err.response?.status === 401 || err.message?.includes('expired') || err.response?.data?.message?.includes('expired');
        if (isSessionExpired) {
          alert("Your payment was successful. Please sign in again to continue.");
          await logout();
          navigate('/login');
        } else {
          toast.error('Failed to process payment. Please try again.');
        }
      }
    }, stages.length * 600);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();

    if (paymentMethod === 'Digital Wallet') {
      if (giftCardBalance < total) {
        toast.error('Insufficient wallet balance.');
        return;
      }
      executeOrder('Digital Wallet');
    } else if (paymentMethod === 'Cash on Delivery') {
      executeOrder('Cash on Delivery');
    } else {
      // Dummy Gateway Validation
      if (dummyMethod === 'Card') {
        const cleanCard = cardNumber.replace(/\s/g, '');
        if (cleanCard.length !== 16) {
          toast.error('Please enter a valid 16-digit card number.');
          return;
        }
        if (!/^(0[1-9]|1[0-2])\/?([0-9]{2})$/.test(cardExpiry)) {
          toast.error('Please enter a valid expiry (MM/YY).');
          return;
        }
        if (cardCvv.length !== 3) {
          toast.error('Please enter a valid 3-digit CVV.');
          return;
        }
        executeOrder('Simulated Card');
      } else if (dummyMethod === 'UPI') {
        if (!upiId.includes('@')) {
          toast.error('Please enter a valid UPI ID.');
          return;
        }
        setShowQrCode(true);
      } else if (dummyMethod === 'Netbanking') {
        if (accountNumber.length < 8) {
          toast.error('Please enter a valid bank account number.');
          return;
        }
        if (ifscCode.length !== 11) {
          toast.error('IFSC code must be exactly 11 alphanumeric characters.');
          return;
        }
        executeOrder(`Simulated Netbanking (${selectedBank})`);
      }
    }
  };

  // Review helper functions
  const hasPurchasedProduct = (productId) => {
    return (orders || []).some(o => 
      o.status === 'Completed' && 
      o.items && o.items.some(item => item.productId === productId)
    );
  };

  const handleOpenReviews = async (product) => {
    setActiveReviewProduct(product);
    setProductReviews([]);
    setShowViewReviewsDialog(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/products/${product.id || product._id}/reviews`);
      if (res.data.success) {
        setProductReviews(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenWriteReview = (product) => {
    setActiveReviewProduct(product);
    setReviewRating(5);
    setReviewText('');
    setShowReviewDialog(true);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      toast.error('Please enter your review comments.');
      return;
    }

    try {
      const token = localStorage.getItem('luxe_user_token');
      const authConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/products/${activeReviewProduct.id || activeReviewProduct._id}/reviews`,
        { rating: reviewRating, text: reviewText },
        authConfig
      );

      if (res.data.success) {
        toast.success('Product review submitted successfully!');
        setShowReviewDialog(false);
        setReviewText('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 animate-in fade-in duration-500 max-w-7xl mx-auto relative font-sans text-on-surface">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-headline font-bold mb-2">Grooming Shop</h1>
          <p className="text-on-surface-variant text-label-md max-w-2xl font-medium">
            Elevate your routine with our curated selection of premium grooming essentials, 
            used and recommended by our master stylists.
          </p>
        </div>
        
        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex items-center gap-2 bg-surface-container-high px-5 py-3 rounded-xl border border-white/10 hover:border-primary/30 transition-all cursor-pointer shadow-lg active:scale-95"
        >
          <span className="material-symbols-outlined text-primary">shopping_cart</span>
          <span className="font-bold">{cart.reduce((s, i) => s + i.quantity, 0)} items</span>
        </button>
      </div>

      {/* Categories Filter */}
      <div className="flex gap-3 overflow-x-auto pb-4 mb-8 no-scrollbar">
        {categories.map((cat, idx) => (
          <button 
            key={idx}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              selectedCategory === cat 
                ? 'bg-primary text-on-primary font-bold' 
                : 'bg-surface-container border border-white/10 text-on-surface hover:bg-white/5'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Shop Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts && filteredProducts.map((product, idx) => (
          <motion.div 
            key={product.id || product._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group flex flex-col bg-surface-container rounded-2xl overflow-hidden border border-white/5 hover:border-primary/30 transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] h-[460px]"
          >
            <div className="h-52 relative overflow-hidden bg-surface-container-high shrink-0">
              <img 
                src={resolveProductImage(product.image, product.updatedAt)} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  e.target.src = DEFAULT_PRODUCT_IMAGE;
                }}
              />
              <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 flex gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  {product.category}
                </span>
                <span className={`text-[10px] font-black uppercase tracking-wider ${
                  product.stockStatus === 'Out of Stock' ? 'text-red-400' : 'text-emerald-400'
                }`}>
                  • {product.stockStatus || 'In Stock'}
                </span>
              </div>
            </div>
            
            <div className="p-5 flex flex-col justify-between flex-grow">
              <div>
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h3 className="font-bold text-on-surface text-base md:text-lg leading-tight group-hover:text-primary transition-colors truncate">
                    {product.name}
                  </h3>
                  <span className="font-headline font-bold text-primary whitespace-nowrap">
                    ₹{product.price}
                  </span>
                </div>
                
                {/* Rating & Reviews links */}
                <div className="flex items-center gap-2 mb-3">
                  <button 
                    onClick={() => handleOpenReviews(product)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <span className="material-symbols-outlined text-[14px] text-primary">star</span>
                    Reviews
                  </button>
                  {hasPurchasedProduct(product.id || product._id) && (
                    <>
                      <span className="text-on-surface-variant text-[10px]">•</span>
                      <button 
                        onClick={() => handleOpenWriteReview(product)}
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <span className="material-symbols-outlined text-[14px] text-emerald-400">rate_review</span>
                        Write Review
                      </button>
                    </>
                  )}
                </div>

                <p className="text-xs text-on-surface-variant line-clamp-2 mb-4">
                  {product.description}
                </p>
              </div>
              
              <div className="flex gap-2.5 mt-auto">
                <button 
                  onClick={() => product.stockStatus !== 'Out of Stock' && addToCart(product)}
                  disabled={product.stockStatus === 'Out of Stock'}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    product.stockStatus === 'Out of Stock'
                      ? 'bg-white/5 border-white/5 text-on-surface-variant/40 cursor-not-allowed'
                      : 'bg-white/5 border-white/10 text-on-surface hover:bg-white/10 cursor-pointer'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {product.stockStatus === 'Out of Stock' ? 'do_not_disturb_on' : 'add_shopping_cart'}
                  </span>
                  Add
                </button>
                
                <button 
                  onClick={() => product.stockStatus !== 'Out of Stock' && handleBuyNow(product)}
                  disabled={product.stockStatus === 'Out of Stock'}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    product.stockStatus === 'Out of Stock'
                      ? 'bg-white/5 text-on-surface-variant/40 cursor-not-allowed'
                      : 'bg-primary text-on-primary hover:opacity-95 cursor-pointer shadow-md'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    flash_on
                  </span>
                  Buy Now
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {(!filteredProducts || filteredProducts.length === 0) && (
          <div className="col-span-full py-12 text-center text-on-surface-variant text-sm">
            No products available in this category.
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface-container-high border-l border-white/10 z-50 p-6 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center pb-6 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">shopping_cart</span>
                  <h2 className="text-xl font-bold">Your Cart</h2>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {cart.length > 0 ? (
                <>
                  <div className="flex-grow overflow-y-auto py-6 flex flex-col gap-4 no-scrollbar">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center bg-white/2 p-3.5 rounded-xl border border-white/5">
                        <img 
                          src={resolveProductImage(item.image, item.updatedAt)} 
                          alt={item.name} 
                          className="w-16 h-16 object-cover rounded-lg border border-white/5"
                          onError={(e) => {
                            e.target.src = DEFAULT_PRODUCT_IMAGE;
                          }}
                        />
                        <div className="flex-grow min-w-0">
                          <h4 className="font-bold text-sm truncate">{item.name}</h4>
                          <span className="text-primary text-sm font-headline font-semibold">₹{item.price}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2.5">
                          <div className="flex items-center gap-2 bg-surface-container px-2 py-1 rounded-lg border border-white/5">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">remove</span>
                            </button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">delete</span>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-white/5 flex flex-col gap-4 bg-surface-container-high">
                    <div className="flex justify-between text-sm text-on-surface-variant">
                      <span>Subtotal</span>
                      <span>₹{subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm text-on-surface-variant">
                      <span>GST (18%)</span>
                      <span>₹{tax}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/5">
                      <span>Total</span>
                      <span className="text-primary font-headline">₹{total}</span>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">credit_card</span>
                      Proceed to Checkout
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-on-surface-variant">
                  <span className="material-symbols-outlined text-5xl text-primary/30 mb-3">shopping_cart</span>
                  <p className="font-medium text-sm">Your shopping cart is empty.</p>
                  <p className="text-xs mt-1">Add items from the store to get started!</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Payment Gateway Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={closeCheckout}
              className="absolute inset-0 bg-black"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-container-high border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">payments</span>
                    {checkoutItem ? 'Direct Purchase Checkout' : 'Cart Checkout'}
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-1">Complete your transaction securely.</p>
                </div>
                {!isProcessingPayment && (
                  <button 
                    onClick={closeCheckout}
                    className="p-1 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>

              {/* Processing Spinner Stage */}
              {isProcessingPayment ? (
                <div className="p-12 flex flex-col items-center justify-center text-center gap-4 min-h-[350px]">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <span className="material-symbols-outlined text-primary text-2xl animate-pulse">lock</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Processing Secured Payment</h4>
                    <p className="text-xs text-on-surface-variant mt-1.5 font-mono">{paymentStatusText}</p>
                  </div>
                </div>
              ) : showQrCode ? (
                /* QR Code Scanner Interface for UPI */
                <div className="p-8 flex flex-col items-center text-center gap-6 min-h-[350px]">
                  <div>
                    <h4 className="font-bold text-lg">Scan QR to Approve Instantly</h4>
                    <p className="text-xs text-on-surface-variant mt-1">UPI ID: {upiId}</p>
                  </div>
                  
                  <div className="flex flex-col items-center bg-white p-5 rounded-2xl border border-white/10 w-fit text-black shadow-xl">
                    <div className="w-40 h-40 bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 relative rounded-lg">
                      <span className="material-symbols-outlined text-7xl text-slate-800">qr_code_2</span>
                      <div className="absolute w-10 h-10 bg-primary rounded-full border-2 border-white flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-on-primary text-lg">payments</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 mt-3 font-mono tracking-widest">BHIM UPI • LUXEGROOM</span>
                  </div>

                  <div className="flex flex-col gap-2.5 w-full max-w-xs">
                    <button
                      onClick={() => executeOrder(`UPI (${upiId})`)}
                      className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold shadow-lg hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      Simulate Self-Approve
                    </button>
                    <button
                      onClick={() => setShowQrCode(false)}
                      className="w-full bg-white/5 border border-white/10 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 transition-all cursor-pointer"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              ) : (
                /* Checkout Form options */
                <form onSubmit={handlePaymentSubmit} className="p-6 flex flex-col gap-6">
                  {/* Summary */}
                  <div className="bg-white/2 rounded-xl p-4 border border-white/5">
                    <h4 className="font-bold text-sm mb-2">Order Summary</h4>
                    <div className="flex flex-col gap-1.5 text-xs text-on-surface-variant">
                      {activeCheckoutItems.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.name} x {item.quantity || 1}</span>
                          <span>₹{item.price * (item.quantity || 1)}</span>
                        </div>
                      ))}
                      <div className="border-t border-white/5 pt-1.5 mt-1.5 flex justify-between font-bold text-sm text-on-surface">
                        <span>Total Amount (incl. tax)</span>
                        <span className="text-primary font-headline">₹{total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Dummy Gateway')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === 'Dummy Gateway'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-white/5 bg-white/2 text-on-surface-variant hover:bg-white/5'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl mb-1">integration_instructions</span>
                        <span className="font-bold text-[10px]">Gateway</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Digital Wallet')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === 'Digital Wallet'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-white/5 bg-white/2 text-on-surface-variant hover:bg-white/5'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl mb-1">account_balance_wallet</span>
                        <span className="font-bold text-[10px]">Wallet</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('Cash on Delivery')}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentMethod === 'Cash on Delivery'
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-white/5 bg-white/2 text-on-surface-variant hover:bg-white/5'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl mb-1">local_shipping</span>
                        <span className="font-bold text-[10px]">COD</span>
                      </button>
                    </div>
                  </div>

                  {/* Specific Fields */}
                  {paymentMethod === 'Dummy Gateway' && (
                    <div className="flex flex-col gap-4 border border-white/5 bg-white/2 p-4 rounded-xl">
                      {/* Tabs */}
                      <div className="flex gap-2 bg-surface-container p-1 rounded-lg border border-white/5">
                        {['Card', 'UPI', 'Netbanking'].map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setDummyMethod(tab)}
                            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                              dummyMethod === tab
                                ? 'bg-primary text-on-primary'
                                : 'text-on-surface-variant hover:text-on-surface'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {/* Card fields */}
                      {dummyMethod === 'Card' && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col gap-3"
                        >
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                              Card Number
                            </label>
                            <input 
                              type="text"
                              required
                              placeholder="4242 4242 4242 4242"
                              value={cardNumber}
                              onChange={handleCardNumberChange}
                              className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-on-surface font-mono"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                                Expiry (MM/YY)
                              </label>
                              <input 
                                type="text"
                                required
                                placeholder="12/28"
                                value={cardExpiry}
                                onChange={handleExpiryChange}
                                className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-on-surface font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                                CVV
                              </label>
                              <input 
                                type="password"
                                required
                                placeholder="***"
                                value={cardCvv}
                                onChange={handleCvvChange}
                                className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-on-surface font-mono"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* UPI ID */}
                      {dummyMethod === 'UPI' && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col gap-2"
                        >
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                            UPI ID
                          </label>
                          <input 
                            type="text"
                            required
                            placeholder="username@bank"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-on-surface font-mono"
                          />
                        </motion.div>
                      )}

                      {/* Netbanking Account Details */}
                      {dummyMethod === 'Netbanking' && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col gap-3"
                        >
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                                Bank Name
                              </label>
                              <select 
                                value={selectedBank}
                                onChange={(e) => setSelectedBank(e.target.value)}
                                className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-on-surface"
                              >
                                <option>HDFC Bank</option>
                                <option>ICICI Bank</option>
                                <option>State Bank of India</option>
                                <option>Axis Bank</option>
                                <option>Kotak Mahindra Bank</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                                IFSC Code
                              </label>
                              <input 
                                type="text"
                                required
                                placeholder="HDFC0000242"
                                value={ifscCode}
                                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                                className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-on-surface font-mono"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                              Account Number
                            </label>
                            <input 
                              type="text"
                              required
                              placeholder="5010024927492"
                              value={accountNumber}
                              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-on-surface font-mono"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'Digital Wallet' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs text-on-surface-variant">Available Wallet Balance</p>
                        <p className="text-lg font-bold font-headline">₹{giftCardBalance}</p>
                      </div>
                      {giftCardBalance < total ? (
                        <span className="text-xs font-bold text-red-400">Insufficient Balance</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-400">Sufficient Balance</span>
                      )}
                    </motion.div>
                  )}

                  {paymentMethod === 'Cash on Delivery' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4 flex items-start gap-3"
                    >
                      <span className="material-symbols-outlined text-amber-400">info</span>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Cash on Delivery Selected</p>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          You can pay via Cash or UPI directly to our delivery executive when your grooming items arrive. No pre-payment is required!
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Submit / Pay Button */}
                  <button
                    type="submit"
                    disabled={paymentMethod === 'Digital Wallet' && giftCardBalance < total}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg text-sm ${
                      (paymentMethod === 'Digital Wallet' && giftCardBalance < total)
                        ? 'bg-red-950/20 border border-red-500/20 text-red-400/40 cursor-not-allowed'
                        : 'bg-primary text-on-primary hover:opacity-90 active:scale-98 cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    {paymentMethod === 'Digital Wallet' 
                      ? `Pay ₹${total} from Wallet` 
                      : paymentMethod === 'Cash on Delivery' 
                      ? 'Confirm Order (COD)' 
                      : dummyMethod === 'UPI' 
                      ? 'Generate UPI QR Code' 
                      : 'Authorize Payment'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Reviews View Dialog */}
      <AnimatePresence>
        {showViewReviewsDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewReviewsDialog(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-container-high border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">reviews</span>
                    {activeReviewProduct?.name} Reviews
                  </h3>
                </div>
                <button 
                  onClick={() => setShowViewReviewsDialog(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 flex-grow overflow-y-auto flex flex-col gap-4 no-scrollbar">
                {productReviews.length > 0 ? (
                  productReviews.map((rev) => (
                    <div key={rev._id || rev.id} className="bg-white/2 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-on-surface">{rev.clientName}</span>
                        <div className="flex items-center text-primary">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <span key={i} className="material-symbols-outlined text-[16px]">star</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{rev.text}</p>
                      <span className="text-[10px] text-on-surface-variant self-end">{rev.date}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-on-surface-variant text-sm flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-primary/30">rate_review</span>
                    No reviews for this product yet.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Write Product Review Dialog */}
      <AnimatePresence>
        {showReviewDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewDialog(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-container-high border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/2">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400">rate_review</span>
                  Write a Review
                </h3>
                <button 
                  onClick={() => setShowReviewDialog(false)}
                  className="p-1 rounded-full hover:bg-white/5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleReviewSubmit} className="p-6 flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="text-primary hover:scale-110 active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[32px]">
                          {star <= reviewRating ? 'star' : 'star_border'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                    Your Review
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about your experience with this product..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-on-surface resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold shadow-lg hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span className="material-symbols-outlined text-[20px]">send</span>
                  Submit Review
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShopPage;

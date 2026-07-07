import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from "@/shared/context/AppContext";
import { formatCurrency } from "@/shared/utils/format";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from "@/shared/components/ui/alert-dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/shared/components/ui/drawer";
import { toast } from 'sonner';
import { WalletCard, Transaction } from "@/shared/types/wallet";

const WalletPage: React.FC = () => {
  const {
    walletCards,
    walletTransactions,
    giftCardBalance,
    giftCardRedemptions,
    addWalletCard,
    deleteWalletCard,
    setDefaultWalletCard,
    redeemGiftCard
  } = useApp();

  const navigate = useNavigate();

  // Tabs state
  const [activeTab, setActiveTab] = useState('cards');

  // Add Card Modal State
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCvv, setNewCardCvv] = useState('');
  const [newCardName, setNewCardName] = useState('');

  // Delete Card Confirmation Dialog State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  // Transaction Receipt Drawer State
  const [receiptDrawerOpen, setReceiptDrawerOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Gift Card Code Input
  const [giftCode, setGiftCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Handle Add Card Submit
  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber || !newCardExpiry || !newCardCvv || !newCardName) {
      toast.error('Please fill out all fields.');
      return;
    }

    // Basic format validation
    const cleanNum = newCardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 12 || cleanNum.length > 19) {
      toast.error('Invalid card number length.');
      return;
    }

    const maskedNum = `•••• •••• •••• ${cleanNum.slice(-4)}`;

    addWalletCard({
      number: maskedNum,
      expiry: newCardExpiry,
      cvv: newCardCvv,
      name: newCardName.toUpperCase()
    });

    setAddCardOpen(false);
    setNewCardNumber('');
    setNewCardExpiry('');
    setNewCardCvv('');
    setNewCardName('');
  };

  // Handle Delete Click
  const handleDeleteClick = (id: string) => {
    setCardToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (cardToDelete) {
      deleteWalletCard(cardToDelete);
      setCardToDelete(null);
    }
  };

  // Handle Redeem Submit
  const handleRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCode.trim()) return;

    setIsRedeeming(true);
    try {
      const amount = redeemGiftCard(giftCode);
      toast.success(`Redeemed! ₹${amount} added to your wallet.`);
      setGiftCode('');
    } catch (err: any) {
      toast.error(err.message || 'Redemption failed.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleRebookClick = (tx: Transaction) => {
    setReceiptDrawerOpen(false);
    navigate('/services', {
      state: {
        prefilledServiceName: tx.serviceName,
        prefilledStylistName: tx.stylistName
      }
    });
  };

  // Format Card Expiry
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 4) input = input.slice(0, 4);
    if (input.length > 2) {
      input = `${input.slice(0, 2)}/${input.slice(2)}`;
    }
    setNewCardExpiry(input);
  };

  // Format Card Number (space grouping)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = [];
    for (let i = 0; i < input.length; i += 4) {
      parts.push(input.slice(i, i + 4));
    }
    setNewCardNumber(parts.join(' '));
  };

  // Group transactions by month helper
  const getGroupedTransactions = () => {
    const groups: { [key: string]: Transaction[] } = {};
    walletTransactions.forEach((tx: Transaction) => {
      const date = new Date(tx.date);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(tx);
    });
    return groups;
  };

  const groupedTx = getGroupedTransactions();

  return (
    <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto font-body min-h-screen">
      {/* Page Header */}
      <section className="mb-unit-lg text-center md:text-left">
        <p className="text-primary font-label-md text-xs uppercase tracking-widest mb-2 font-bold">Payments</p>
        <h2 className="font-headline text-3xl md:text-5xl text-on-surface">Digital Wallet</h2>
        <p className="text-on-surface-variant font-body text-xs md:text-sm mt-1 max-w-xl">
          Manage saved payment cards, gift vouchers, and view monthly transaction receipts.
        </p>
      </section>

      {/* Tabs list with filter options */}
      <section className="mb-8 flex flex-col items-center justify-between border-b border-white/5 pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center md:justify-start w-full">
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="cards" className="w-1/3 sm:w-32">Cards</TabsTrigger>
              <TabsTrigger value="transactions" className="w-1/3 sm:w-32">Transactions</TabsTrigger>
              <TabsTrigger value="giftcards" className="w-1/3 sm:w-32">Gift Cards</TabsTrigger>
            </TabsList>
          </div>

          {/* --- CARDS TAB CONTENT --- */}
          <TabsContent value="cards" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
              {/* Stacked Cards Visuals */}
              <div className="lg:col-span-7 space-y-6">
                <h3 className="text-sm uppercase font-bold tracking-wider text-on-surface-variant mb-4">Saved Cards</h3>
                
                {walletCards.length === 0 ? (
                  <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center bg-white/[0.01]">
                    <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">credit_card</span>
                    <p className="text-xs text-on-surface-variant">No credit cards saved in your wallet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {walletCards.map((card: WalletCard, index: number) => {
                      const isVisa = card.brand === 'visa';
                      const isMastercard = card.brand === 'mastercard';
                      
                      return (
                        <div
                          key={card.id}
                          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1c1d1d] to-[#0a0a0a] border border-white/10 shadow-2xl p-6 text-white h-48 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1 hover:border-primary/30"
                        >
                          {/* Noise texture overlay */}
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-10 pointer-events-none" />
                          
                          {/* Card Top bar */}
                          <div className="flex justify-between items-start z-10">
                            <div>
                              <span className="text-[9px] uppercase tracking-widest font-extrabold text-primary">Luxe Groom Pass</span>
                              {card.isDefault && (
                                <Badge variant="gold" className="ml-3 px-2 py-0 text-[8px] tracking-tighter">Default</Badge>
                              )}
                            </div>
                            {/* Brand Logos */}
                            <span className="font-headline italic font-black text-sm tracking-widest uppercase">
                              {isVisa ? 'VISA' : isMastercard ? 'MC' : 'RUPAY'}
                            </span>
                          </div>

                          {/* Embossed Card Number */}
                          <div className="my-2 z-10">
                            <p className="text-xl font-headline tracking-widest text-shadow-sm font-semibold select-all font-mono">
                              {card.number}
                            </p>
                          </div>

                          {/* Card bottom details */}
                          <div className="flex justify-between items-end z-10">
                            <div>
                              <span className="text-[7px] text-on-surface-variant uppercase tracking-wider block">Card Holder</span>
                              <span className="text-xs font-bold font-mono tracking-wider">{card.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[7px] text-on-surface-variant uppercase tracking-wider block">Expires</span>
                              <span className="text-xs font-bold font-mono">{card.expiry}</span>
                            </div>
                          </div>

                          {/* Actions on Card Hover */}
                          <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all duration-300 rounded-2xl z-20">
                            {!card.isDefault && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDefaultWalletCard(card.id)}
                              >
                                Set Default
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(card.id)}
                            >
                              Delete Card
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Card Sidebar Action */}
              <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
                <h4 className="font-headline font-bold text-lg text-on-surface mb-2">Wallet Actions</h4>
                <p className="text-xs text-on-surface-variant mb-6">
                  Save your credentials securely. All card data is stored directly on your browser device for instant checkouts.
                </p>
                <Button onClick={() => setAddCardOpen(true)} className="w-full flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">add_card</span> Add New Card
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* --- TRANSACTIONS TAB CONTENT --- */}
          <TabsContent value="transactions" className="mt-8">
            <div className="space-y-8">
              {Object.keys(groupedTx).length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center bg-white/[0.01]">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2">receipt</span>
                  <p className="text-xs text-on-surface-variant">No transaction history found.</p>
                </div>
              ) : (
                Object.entries(groupedTx).map(([month, txList]) => (
                  <div key={month} className="space-y-3">
                    <h4 className="text-[10px] uppercase font-extrabold tracking-wider text-primary">{month}</h4>
                    <div className="space-y-2.5">
                      {txList.map((tx: Transaction) => (
                        <div
                          key={tx.id}
                          onClick={() => {
                            setSelectedTx(tx);
                            setReceiptDrawerOpen(true);
                          }}
                          className="glass-card p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:border-primary/25 cursor-pointer flex justify-between items-center transition-all duration-200"
                        >
                          <div className="flex gap-3.5 items-center">
                            <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center border border-white/5">
                              <span className="material-symbols-outlined text-primary text-[20px]">payments</span>
                            </div>
                            <div>
                              <h5 className="font-semibold text-xs text-on-surface">{tx.serviceName}</h5>
                              <p className="text-[10px] text-on-surface-variant mt-0.5">
                                with {tx.stylistName} • {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right flex items-center gap-4">
                            <div>
                              <span className="text-xs font-bold text-on-surface block">{formatCurrency(tx.amount)}</span>
                              <span className="text-[8px] uppercase tracking-wider block font-bold text-on-surface-variant-high">
                                {tx.status}
                              </span>
                            </div>
                            <span className="material-symbols-outlined text-on-surface-variant/60 text-[18px]">
                              chevron_right
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* --- GIFT CARDS TAB CONTENT --- */}
          <TabsContent value="giftcards" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start">
              {/* Gift Balance Hero Card */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="bg-gradient-to-br from-[#1c1d1d] to-[#0c0d0d] border border-primary/25 relative overflow-hidden rounded-2xl p-8">
                  {/* Glowing background highlights */}
                  <div className="absolute right-0 top-0 w-36 h-36 bg-primary/10 rounded-full blur-3xl" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Luxe Gift Balance</span>
                      <h3 className="font-headline text-4xl md:text-5xl font-extrabold text-primary mt-2">
                        {formatCurrency(giftCardBalance)}
                      </h3>
                      <p className="text-[10px] text-on-surface-variant-high mt-1.5 font-bold">Voucher funds active & ready</p>
                    </div>
                    <span className="material-symbols-outlined text-primary text-4xl">featured_seasonal_and_gifts</span>
                  </div>
                </Card>

                {/* Redemption History */}
                <div>
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-on-surface-variant mb-4">Redemption History</h4>
                  
                  {giftCardRedemptions.length === 0 ? (
                    <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center bg-white/[0.01]">
                      <p className="text-xs text-on-surface-variant">No vouchers redeemed yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {giftCardRedemptions.map((red) => (
                        <div
                          key={red.id}
                          className="p-3 bg-surface-container rounded-xl border border-white/5 flex justify-between items-center text-xs"
                        >
                          <div>
                            <span className="font-bold text-on-surface block">{red.description}</span>
                            <span className="text-[10px] text-on-surface-variant block mt-0.5">
                              Code: <strong className="text-primary font-mono">{red.code}</strong> • {new Date(red.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <span className="font-bold text-green-400">+{formatCurrency(red.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Redeem Gift Code Action */}
              <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/5 bg-white/[0.01] space-y-4">
                <div>
                  <h4 className="font-headline font-bold text-lg text-on-surface">Redeem Voucher</h4>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    Have a digital gift card code? Enter the 8-character unique coupon pin to top up your balance.
                  </p>
                </div>

                {/* Helpful tips in alert */}
                <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 text-[10px] text-primary space-y-1 font-semibold uppercase tracking-wider">
                  <span className="block font-extrabold text-[11px] mb-1">Try Demo Codes:</span>
                  <span className="block">• FESTIVE1000 (adds ₹1,000)</span>
                  <span className="block">• GROOM2000 (adds ₹2,000)</span>
                </div>

                <form onSubmit={handleRedeemSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={giftCode}
                    onChange={(e) => setGiftCode(e.target.value)}
                    className="flex-grow bg-surface-container border border-white/5 rounded-xl px-4 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/30 focus:outline-none focus:border-primary/50 font-mono"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isRedeeming || !giftCode.trim()}
                    className="whitespace-nowrap px-4 py-2.5 h-11"
                  >
                    Redeem
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* --- ADD NEW CARD DIALOG MODAL --- */}
      <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Credit/Debit Card</DialogTitle>
            <DialogDescription>
              Store your bank credentials for premium instant checkout. Connection is encrypted & local.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddCardSubmit} className="space-y-4 mt-2">
            <div className="space-y-1">
              <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                Cardholder Name
              </label>
              <input
                type="text"
                placeholder="E.G. JAMES MERCER"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 font-mono uppercase"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                Card Number
              </label>
              <input
                type="text"
                placeholder="4000 1234 5678 9010"
                value={newCardNumber}
                onChange={handleCardNumberChange}
                className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                  Expiry Date
                </label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={newCardExpiry}
                  onChange={handleExpiryChange}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">
                  CVV Code
                </label>
                <input
                  type="password"
                  placeholder="•••"
                  maxLength={3}
                  value={newCardCvv}
                  onChange={(e) => setNewCardCvv(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary/50 font-mono"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4 flex gap-2 justify-end">
              <Button variant="outline" type="button" onClick={() => setAddCardOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Card
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- CONFIRM DELETE ALERT DIALOG --- */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saved Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment card from your digital wallet? You will have to re-enter details for future bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>
              Keep Card
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600">
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* --- TRANSACTION RECEIPT DRAWER --- */}
      <Drawer open={receiptDrawerOpen} onOpenChange={setReceiptDrawerOpen}>
        {selectedTx && (
          <DrawerContent className="max-w-md">
            <DrawerHeader>
              <DrawerTitle>Luxury Grooming Receipt</DrawerTitle>
              <DrawerDescription>
                Invoice statement generated on {new Date(selectedTx.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </DrawerDescription>
            </DrawerHeader>

            <div className="space-y-4 my-3 text-xs divide-y divide-white/5">
              <div className="pb-3 flex justify-between">
                <div>
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Receipt Number</span>
                  <span className="text-on-surface font-semibold font-mono block mt-0.5">{selectedTx.receiptNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Payment Status</span>
                  <Badge variant={selectedTx.status === 'Paid' ? 'success' : selectedTx.status === 'Refunded' ? 'destructive' : 'warning'} className="mt-0.5">
                    {selectedTx.status}
                  </Badge>
                </div>
              </div>

              <div className="py-3 space-y-2">
                <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Service Breakdown</span>
                <div className="flex justify-between items-center text-sm font-semibold">
                  <span>{selectedTx.serviceName}</span>
                  <span className="text-primary font-bold">{formatCurrency(selectedTx.amount)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant text-[11px]">
                  <span>Stylist Specialist: {selectedTx.stylistName}</span>
                  <span>Studio Location: Main Salon</span>
                </div>
              </div>

              <div className="py-3 flex justify-between items-center text-xs">
                <div>
                  <span className="text-on-surface-variant font-bold uppercase tracking-wider text-[9px] block">Charged to</span>
                  <span className="text-on-surface font-semibold block mt-0.5">{selectedTx.paymentMethod}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold block">Total Bill</span>
                  <span className="text-lg font-headline font-bold text-primary block mt-0.5">{formatCurrency(selectedTx.amount)}</span>
                </div>
              </div>
            </div>

            <DrawerFooter className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-white/5">
              <Button variant="outline" className="w-full" onClick={() => setReceiptDrawerOpen(false)}>
                Close Receipt
              </Button>
              {selectedTx.status !== 'Refunded' && (
                <Button className="w-full flex items-center justify-center gap-1.5" onClick={() => handleRebookClick(selectedTx)}>
                  <span className="material-symbols-outlined text-[18px]">autorenew</span> Rebook Service
                </Button>
              )}
            </DrawerFooter>
          </DrawerContent>
        )}
      </Drawer>
    </main>
  );
};

export default WalletPage;

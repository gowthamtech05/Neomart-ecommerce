export const getExpiryDiscount = (expiryDate) => {
  if (!expiryDate) return 0;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return 20;
  if (diffDays < 10) return 15;
  return 0;
};

export const getDaysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
};

export const getBaseDiscount = (mrp, discountedPrice) => {
  if (!mrp || !discountedPrice || mrp <= 0) return 0;
  return Math.round(((mrp - discountedPrice) / mrp) * 100);
};

export const getLoyalExtra = (product) => {
  if (!product) return { total: 0, factors: {} };

  const today = new Date();
  const expiry = new Date(product.expiryDate);
  const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  let expiryBonus = 0;
  if (product.expiryDate && days < 10) expiryBonus += 5;
  if (product.expiryDate && days < 7) expiryBonus += 5;

  const views = product.views ?? 0;
  const salesCount = product.salesCount ?? 0;
  const stock = product.quantity ?? 0;

  const viewsBonus = Number(views) < 50 ? 5 : 0;
  const salesBonus = Number(salesCount) < 20 ? 5 : 0;
  const stockBonus = Number(stock) === 10 ? 5 : 0;
  const total = expiryBonus + viewsBonus + salesBonus + stockBonus;

  return {
    total,
    factors: {
      expiryBonus,
      viewsBonus,
      salesBonus,
      stockBonus,
      viewsAtOrder: Number(views),
      salesCountAtOrder: Number(salesCount),
      stockAtOrder: Number(stock),
    },
  };
};

export const calculateDiscountedPrice = (
  product,
  user = {},
  { isLowestPriceItem = false, isFirstOrder = false, quantityIndex = 0 } = {},
) => {
  const mrp = Number(product?.price) || 0;
  const discountedPrice = Number(product?.discountedPrice) || mrp;

  const baseDiscount = getBaseDiscount(mrp, discountedPrice);
  const expiryDiscount = getExpiryDiscount(product?.expiryDate);
  const daysUntilExpiry = getDaysUntilExpiry(product?.expiryDate);

  let totalDiscount = baseDiscount + expiryDiscount;
  let appliedLabel = "";

  const isNewUser = user?.isNewUser === true;
  let isNewUserOffer = false;
  if (isNewUser && isFirstOrder && isLowestPriceItem && quantityIndex === 0) {
    totalDiscount += 20;
    appliedLabel = "NEW USER OFFER";
    isNewUserOffer = true;
  }

  const loyaltyPoints = Number(user?.loyaltyPoints || 0);
  let isLoyalOffer = false;
  let loyalExtraPercent = 0;
  let loyalFactors = {};
  if (!appliedLabel && loyaltyPoints >= 20 && quantityIndex === 0) {
    const { total, factors } = getLoyalExtra(product);
    if (total > 0) {
      totalDiscount += total;
      appliedLabel = "LOYALTY OFFER";
      isLoyalOffer = true;
      loyalExtraPercent = total;
      loyalFactors = factors;
    }
  }

  let isPlusOffer = false;
  let plusExtraPercent = 0;
  if (user?.isPlusMember) {
    totalDiscount += 5;
    isPlusOffer = true;
    plusExtraPercent = 5;
    if (!appliedLabel) appliedLabel = "PLUS MEMBER";
  }

  const cap = user?.isPlusMember ? 30 : 25;
  if (totalDiscount > cap) totalDiscount = cap;

  const finalPrice = Math.max(1, Math.round(mrp - (mrp * totalDiscount) / 100));

  return {
    finalPrice,
    mrp,
    discountedPrice,
    totalDiscount,
    baseDiscount,
    expiryDiscount,
    daysUntilExpiry,
    appliedLabel,
    offerDetails: {
      appliedLabel,
      baseDiscount,
      expiryDiscount,
      expiryDate: product?.expiryDate || null,
      daysUntilExpiry,
      isNewUserOffer,
      newUserProductName: isNewUserOffer ? product?.name || "" : "",
      isLoyalOffer,
      loyalExtraPercent,
      loyalFactors,
      isPlusOffer,
      plusExtraPercent,
      totalDiscountPercent: totalDiscount,
      totalSavings: mrp - finalPrice,
    },
  };
};

export const calculateDeliveryCharge = (total, user) => {
  if (user?.isPlusMember) return 0;
  if (total >= 299) return 0;
  return 39;
};

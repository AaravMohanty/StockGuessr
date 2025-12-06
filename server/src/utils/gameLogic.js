// Calculate PnL for a position
const calculatePnL = (entryPrice, exitPrice, shares) => {
  // For Long (positive shares): (Exit - Entry) * Shares
  // For Short (negative shares): (Entry - Exit) * Abs(Shares) --> (Exit - Entry) * Shares works mathematically same
  return (exitPrice - entryPrice) * shares;
};

// Calculate portfolio value after trade
const calculateEquity = (cash, position) => {
  let equity = cash;
  if (position) {
    // If Long (shares > 0): Cash + Asset Value
    // If Short (shares < 0): Cash - Liability (Shares are negative, so + (NegShares * Price) subtracts value)
    equity += position.shares * position.currentPrice;
  }
  return equity;
};

// Process a trade action
const processTrade = (action, currentPrice, cash, position, shares = 100) => {
  const result = {
    cash,
    position: position ? { ...position } : null,
    pnl: 0,
  };

  const currentShares = result.position ? result.position.shares : 0;
  const currentEntry = result.position ? result.position.entryPrice : 0;

  if (action === 'BUY') {
    // BUYING
    const cost = currentPrice * shares;

    // Check affordabilty (Logic handled by caller/frontend usually, but safe to check here)
    // If covering a short (shares < 0), we use cash? No, verifying "cost" for covering is tricky.
    // Simplified: Just process the math.

    result.cash = cash - cost; // Cash decreases

    if (currentShares === 0) {
      // New Long
      result.position = {
        entryPrice: currentPrice,
        shares: shares,
        currentPrice,
      };
    } else {
      // Modifying position
      const totalShares = currentShares + shares;

      if (totalShares === 0) {
        // Closed position completely
        result.pnl = calculatePnL(currentEntry, currentPrice, currentShares); // PnL on the closed position
        result.position = null;
      } else if (currentShares < 0 && totalShares > 0) {
        // Flip Short to Long (Not supported in simple UI usually, but math: Close Short + Open Long)
        // Ignoring complicated flip for now, assuming simple add/reduce
        result.position = {
          entryPrice: (result.position.shares * result.position.entryPrice + cost) / totalShares, // Weighted Avg
          shares: totalShares,
          currentPrice
        };
      } else {
        // Adding to Long or Reducing Short
        // Weighted Average Entry Price update? 
        // If adding to Long: Update Avg Entry
        // If reducing Short: Avg Entry stays same, Realized PnL? 
        // Simplified Model: Update Weighted Avg on Open/Increase, Keep on Reduce?

        // For simplicity in this game: Always update Weighted Average
        const oldValue = currentShares * currentEntry;
        const newValue = oldValue + (shares * currentPrice);
        result.position = {
          entryPrice: newValue / totalShares,
          shares: totalShares,
          currentPrice
        };
      }
    }

  } else if (action === 'SELL') {
    // SELLING (Shorting or Closing Long)
    const proceeds = currentPrice * shares;
    result.cash = cash + proceeds; // Cash increases

    if (currentShares === 0) {
      // New Short
      result.position = {
        entryPrice: currentPrice,
        shares: -shares, // Negative shares
        currentPrice,
      };
    } else {
      // Modifying position
      const totalShares = currentShares - shares; // Decreasing shares

      if (totalShares === 0) {
        // Closed position available
        result.pnl = calculatePnL(currentEntry, currentPrice, currentShares);
        result.position = null;
      } else {
        // Adding to Short or Reducing Long
        const oldValue = currentShares * currentEntry;
        const newValue = oldValue - (shares * currentPrice); // Math works for weighted avg
        result.position = {
          entryPrice: newValue / totalShares,
          shares: totalShares,
          currentPrice
        };
      }
    }
  }

  return result;
};

module.exports = {
  calculatePnL,
  calculateEquity,
  processTrade,
};

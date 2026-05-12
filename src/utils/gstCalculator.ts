export interface GSTBreakdown {
  taxableAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
  isInterstate: boolean;
}

export const calculateGST = (
  amount: number,
  taxRate: number,
  businessStateCode: string,
  customerStateCode?: string
): GSTBreakdown => {
  const isInterstate = !!customerStateCode && businessStateCode !== customerStateCode;
  const taxableAmount = amount;
  const totalTax = (taxableAmount * taxRate) / 100;
  
  let cgstRate = 0, cgstAmount = 0, sgstRate = 0, sgstAmount = 0, igstRate = 0, igstAmount = 0;

  if (isInterstate) {
    igstRate = taxRate;
    igstAmount = totalTax;
  } else {
    cgstRate = taxRate / 2;
    cgstAmount = totalTax / 2;
    sgstRate = taxRate / 2;
    sgstAmount = totalTax / 2;
  }

  return {
    taxableAmount,
    cgstRate,
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstRate,
    sgstAmount: Number(sgstAmount.toFixed(2)),
    igstRate,
    igstAmount: Number(igstAmount.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    totalAmount: Number((taxableAmount + totalTax).toFixed(2)),
    isInterstate
  };
};

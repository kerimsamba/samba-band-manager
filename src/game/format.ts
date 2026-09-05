export const SAVE_KEY = "sambaSocial_v2";
export const money = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
export const cx = (...values: (string | false | undefined)[]) =>
  values.filter(Boolean).join(" ");

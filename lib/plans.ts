export const BRAND = "Leaders CV Checker";
export const TRIAL_REASSURANCE = "7-day free trial. No payment card required.";
export const CONTACT_URL = "https://wa.me/2349157835182?text=Hello%2C%20I'm%20interested%20in%20your%20services";
export type BillingInterval = "monthly" | "annual";
export type PlanId = "basic" | "pro" | "enterprise";
export interface Plan { id: PlanId; name: string; description: string; monthlyPrice: number; monthlyAllowance: number; features: readonly string[]; }
const common = ["Keyword matching and score overview", "PDF viewer", "CV comparison"];
export const PLANS: readonly Plan[] = [
  { id: "basic", name: "Basic", description: "Screen applicant CVs against the requirements of a role.", monthlyPrice: 3500, monthlyAllowance: 10, features: ["10 CV uploads per month", ...common] },
  { id: "pro", name: "Professional", description: "Compare more CVs and review detailed feedback.", monthlyPrice: 7500, monthlyAllowance: 50, features: ["50 CV uploads per month", ...common, "Content and formatting feedback", "Data visualization", "Export reports"] },
  { id: "enterprise", name: "Enterprise", description: "Discuss CV checking for your team or organization.", monthlyPrice: 39500, monthlyAllowance: 999999, features: ["Unlimited CV uploads", ...common, "Content and formatting feedback", "Data visualization"] },
];
export const ANNUAL_DISCOUNT = 0.2;
export function planPrice(plan: Plan, interval: BillingInterval) {
  const equivalentMonthly = interval === "annual" ? Math.round(plan.monthlyPrice * (1 - ANNUAL_DISCOUNT)) : plan.monthlyPrice;
  return { equivalentMonthly, total: equivalentMonthly * (interval === "annual" ? 12 : 1) };
}
export function formatNaira(amount: number) { return `₦${amount.toLocaleString("en-NG")}`; }
export function selectionParams(params: URLSearchParams) {
  const planId = params.get("plan"), billingInterval = params.get("billing");
  if ((planId !== "basic" && planId !== "pro") || (billingInterval !== "monthly" && billingInterval !== "annual")) return "";
  return `?plan=${planId}&billing=${billingInterval}`;
}
export function authDestination(search: string) {
  const selection = selectionParams(new URLSearchParams(search));
  return selection ? `/dashboard/subscription${selection}` : "/dashboard";
}

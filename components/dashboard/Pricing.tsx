import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, X, Zap, FileText, BarChart3, CircleUser, HelpCircle, Sparkles } from 'lucide-react';

interface PricingProps {
  isAnnual?: boolean;
  onChange?: (isAnnual: boolean) => void;
}

// Toggle between monthly and annual billing
function BillingToggle({ isAnnual, onChange }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
        Monthly
      </span>
      <button
        onClick={() => onChange(!isAnnual)}
        className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        role="switch"
        aria-checked={isAnnual}
      >
        <span
          className={`${isAnnual ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-primary transition-transform`}
        />
      </button>
      <div className="flex items-center">
        <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
          Annual
        </span>
        <span className="ml-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Save 20%
        </span>
      </div>
    </div>
  );
}

// Price display with conditional annual discount
function PriceDisplay({ price, isAnnual, showNaira = false }) {
  const monthlyPrice = isAnnual ? Math.round(price * 0.8) : price;
  const currencySymbol = showNaira ? '₦' : '$';

  return (
    <div className="flex items-baseline">
      <span className="text-3xl font-bold">{currencySymbol}{monthlyPrice}</span>
      <span className="text-muted-foreground ml-1">/month</span>
      {isAnnual && (
        <span className="ml-2 text-xs text-muted-foreground line-through">
          {currencySymbol}{price}/mo
        </span>
      )}
    </div>
  );
}

// Feature check item for plan comparison
function FeatureItem({ included, feature }) {
  return (
    <li className="flex items-center gap-3">
      {included ? (
        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      )}
      <span className={included ? "text-foreground" : "text-muted-foreground"}>
        {feature}
      </span>
    </li>
  );
}

function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Basic",
      description: "Essential resume analysis for individuals",
      price: 3500,
      features: [
        { included: true, text: "10 resume analyses per month" },
        { included: true, text: "Basic keyword matching" },
        { included: true, text: "Score overview" },
        { included: true, text: "PDF viewer" },
        { included: true, text: "Email support" },
        { included: true, text: "Resume comparison" },
        { included: false, text: "Advanced analytics" },
        { included: false, text: "AI-powered suggestions" },
        { included: false, text: "Data visualization" },
        { included: false, text: "Priority support" },
      ],
      cta: "Get Started",
      ctaLink: "/signup",
      popular: false,
      icon: FileText
    },
    {
      name: "Professional",
      description: "Advanced features for serious job seekers",
      price: 7500,
      features: [
        { included: true, text: "50 resume analyses per month" },
        { included: true, text: "Advanced keyword matching" },
        { included: true, text: "Detailed analytics & insights" },
        { included: true, text: "AI-powered suggestions" },
        { included: true, text: "Resume comparison tools" },
        { included: true, text: "Data visualization" },
        { included: true, text: "Priority email support" },
        { included: true, text: "Export capabilities" },
        { included: false, text: "API access" },
        { included: false, text: "24/7 phone support" },
      ],
      cta: "Start Pro Trial",
      ctaLink: "/signup?plan=pro",
      popular: true,
      icon: Zap
    },
    {
      name: "Enterprise",
      description: "Comprehensive solution for teams and organizations",
      price: 39500,
      features: [
        { included: true, text: "Unlimited resume analyses" },
        { included: true, text: "Advanced AI recommendations" },
        { included: true, text: "Custom keyword categories" },
        { included: true, text: "Bulk processing" },
        { included: true, text: "Team collaboration tools" },
        { included: true, text: "Advanced reporting" },
        { included: true, text: "API access" },
        { included: true, text: "Dedicated account manager" },
        { included: true, text: "24/7 phone support" },
        { included: true, text: "Custom integrations" },
      ],
      cta: "Contact Sales",
      ctaLink: "/contact",
      popular: false,
      icon: Sparkles
    }
  ];

  return (
    <div className="py-12">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-lg text-muted-foreground">
          Choose the plan that's right for your career goals, with no hidden fees or complicated tiers.
        </p>

        <BillingToggle isAnnual={isAnnual} onChange={setIsAnnual} />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-xl border ${plan.popular ? 'border-primary shadow-lg' : 'border-border'
              }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                  Most Popular
                </span>
              </div>
            )}

            <div className="p-6">
              <div className={`w-10 h-10 rounded-lg ${plan.popular ? 'bg-primary/20' : 'bg-muted'} flex items-center justify-center mb-4`}>
                <plan.icon className={`h-5 w-5 ${plan.popular ? 'text-primary' : 'text-foreground'}`} />
              </div>

              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-muted-foreground mt-1.5 mb-4">{plan.description}</p>

              <div className="mb-6">
                <PriceDisplay price={plan.price} isAnnual={isAnnual} showNaira={true} />
                {plan.price > 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {isAnnual ? 'Billed annually' : 'Billed monthly'}
                  </p>
                )}
              </div>

              <Link
                href={plan.ctaLink}
                className={`w-full flex items-center justify-center px-4 py-2.5 rounded-lg font-medium ${plan.popular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  } transition-colors mb-6`}
              >
                {plan.cta}
              </Link>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-3">Plan includes:</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <FeatureItem
                      key={index}
                      included={feature.included}
                      feature={feature.text}
                    />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h3 className="text-xl font-bold text-center mb-8">Frequently Asked Questions</h3>

        <div className="space-y-4">
          {[
            {
              q: "Can I switch plans later?",
              a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
            },
            {
              q: "What happens to unused credits?",
              a: "Unused credits roll over to the next month for all paid plans."
            },
            {
              q: "Is there a free trial for paid plans?",
              a: "Yes, all new users get a 7-day free trial with unlimited access to all features."
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex gap-4">
                <HelpCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-2">{item.q}</h4>
                  <p className="text-muted-foreground">{item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-12 bg-accent/20 border border-border p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h4 className="text-lg font-bold mb-2">Need a custom solution?</h4>
            <p className="text-muted-foreground">Contact our sales team to discuss enterprise options.</p>
          </div>
         <a
  href="https://wa.me/2349157835182?text=Hello%2C%20I'm%20interested%20in%20your%20services"
  target="_blank"
  rel="noopener noreferrer"
  className="whitespace-nowrap px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
>
  Contact Sales
</a>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="mt-20 text-center">
        <div className="flex flex-wrap justify-center gap-8 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-primary mr-2" />
            <span>Free 7-day trial</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-primary mr-2" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-primary mr-2" />
            <span>Cancel anytime</span>
          </div>
        </div>

        <div className="flex justify-center gap-1 pt-2">
          <CircleUser className="h-6 w-6 text-muted-foreground/70" />
          <CircleUser className="h-6 w-6 text-muted-foreground/70" />
          <CircleUser className="h-6 w-6 text-muted-foreground/70" />
          <span className="text-sm text-muted-foreground ml-2">20,000+ professionals trust ResumeIQ</span>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
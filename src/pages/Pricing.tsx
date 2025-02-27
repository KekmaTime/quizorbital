import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, HelpCircle, ArrowRight } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { SectionBadge } from "@/components/ui/section-badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const PricingTier = ({ 
  name, 
  price, 
  description, 
  features, 
  highlighted = false, 
  buttonText = "Get Started",
  delay = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className={`rounded-xl border ${
        highlighted 
          ? "border-purple-500 bg-gradient-to-b from-purple-500/10 to-cyan-500/10" 
          : "border-gray-800 bg-gray-900"
      } p-8 relative`}
    >
      {highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-sm font-medium py-1 px-4 rounded-full">
          Most Popular
        </div>
      )}
      <h3 className="text-xl font-semibold mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-4xl font-bold">${price}</span>
        {price > 0 && <span className="text-gray-400 ml-2">/month</span>}
      </div>
      <p className="text-gray-400 mb-6">{description}</p>
      <Button 
        className={`w-full mb-8 ${
          highlighted 
            ? "bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600" 
            : "bg-white text-black hover:bg-gray-200"
        }`}
      >
        {buttonText}
      </Button>
      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className={`h-5 w-5 mr-2 flex-shrink-0 ${highlighted ? "text-cyan-400" : "text-green-500"}`} />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

const Pricing = () => {
  const pricingTiers = [
    {
      name: "Free",
      price: 0,
      description: "Perfect for trying out QUIZORBIS and casual learning.",
      features: [
        "5 quizzes per month",
        "Basic analytics",
        "PDF upload (up to 5MB)",
        "Standard question types",
        "Email support"
      ],
      delay: 0.1
    },
    {
      name: "Pro",
      price: 12,
      description: "Ideal for students and dedicated learners.",
      features: [
        "Unlimited quizzes",
        "Advanced analytics",
        "PDF upload (up to 25MB)",
        "All question types",
        "Voice interaction",
        "Priority email support",
        "Learning path recommendations"
      ],
      highlighted: true,
      delay: 0.2
    },
    {
      name: "Teams",
      price: 49,
      description: "For educators and learning groups.",
      features: [
        "Everything in Pro",
        "Up to 25 user accounts",
        "Team analytics dashboard",
        "Collaborative learning features",
        "Custom quiz templates",
        "API access",
        "Dedicated support"
      ],
      delay: 0.3
    }
  ];

  const faqs = [
    {
      question: "Can I change plans at any time?",
      answer: "Yes, you can upgrade, downgrade, or cancel your subscription at any time. Changes to your subscription will take effect immediately, with prorated charges or credits applied to your next billing cycle."
    },
    {
      question: "Is there a discount for annual billing?",
      answer: "Yes! We offer a 20% discount when you choose annual billing for any of our paid plans. This discount will be automatically applied at checkout."
    },
    {
      question: "Do you offer a student discount?",
      answer: "We offer a 50% discount for verified students. Please contact our support team with your student ID or educational email address to apply for the student discount."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and Apple Pay. For Team plans, we also offer invoice payment options."
    },
    {
      question: "Is there a free trial for paid plans?",
      answer: "Yes, all paid plans come with a 14-day free trial. No credit card is required to start your trial, and you can upgrade to a paid plan at any time during or after your trial period."
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "We offer a 30-day money-back guarantee for all new subscriptions. If you're not completely satisfied with QUIZORBIS, contact our support team within 30 days of your initial purchase for a full refund."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="pt-24 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full opacity-20 blur-3xl"></div>
        </div>
        
        <div className="container px-4 mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <SectionBadge className="mb-4">
              <Check className="w-4 h-4 mr-2 text-cyan-400" />
              <span className="text-sm font-medium">Simple, Transparent Pricing</span>
            </SectionBadge>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Choose the Perfect Plan for Your Learning Journey
            </h1>
            
            <p className="text-xl text-gray-400 mb-8">
              Whether you're a casual learner or a dedicated student, we have a plan that fits your needs.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="container px-4 mx-auto pb-24">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <PricingTier key={index} {...tier} />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            All plans include core features like adaptive learning, instant feedback, and progress tracking.
          </p>
          <Button variant="link" className="text-cyan-400 hover:text-cyan-300">
            Compare all features <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Enterprise Section */}
      <div className="bg-gradient-to-r from-purple-900 to-cyan-900 py-16">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
                <p className="text-gray-300 mb-4">
                  QUIZORBIS Enterprise offers custom integrations, dedicated support, and advanced security features for organizations.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-cyan-400" />
                    <span>Custom LMS integration</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-cyan-400" />
                    <span>Advanced analytics and reporting</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 mr-2 text-cyan-400" />
                    <span>Dedicated account manager</span>
                  </li>
                </ul>
              </div>
              <div className="flex-shrink-0">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container px-4 mx-auto py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-400">
              Have questions about our pricing? Find answers to common questions below.
            </p>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-gray-800 rounded-lg overflow-hidden">
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-900/50 transition-colors">
                  <div className="flex items-center text-left">
                    <HelpCircle className="h-5 w-5 mr-3 text-purple-400 flex-shrink-0" />
                    <span>{faq.question}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-0 text-gray-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          <div className="mt-12 text-center">
            <p className="text-gray-400 mb-6">
              Still have questions? We're here to help.
            </p>
            <Button className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
              Contact Support
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Pricing; 
import React from "react";
import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SectionBadge } from "@/components/ui/section-badge";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";
import { HelpCircle, MessageSquare, ArrowRight } from "lucide-react";

const FAQ = () => {
  const faqs = [
    {
      question: "What is QUIZORBIS?",
      answer: "QUIZORBIS is an AI-powered adaptive learning platform that transforms how you master any subject. Our intelligent system creates personalized quizzes from your learning materials and adapts questions based on your performance and learning patterns."
    },
    {
      question: "How does QUIZORBIS work?",
      answer: "Simply upload your learning material (PDF), set your preferences for difficulty and quiz length, and our AI will generate personalized questions. As you take quizzes, the system learns from your responses to focus on areas where you need more practice."
    },
    {
      question: "What types of files can I upload?",
      answer: "Currently, QUIZORBIS supports PDF files. We're working on expanding support for other document formats, presentations, and even video content in future updates."
    },
    {
      question: "Is there a limit to how many quizzes I can create?",
      answer: "Free accounts can create up to 5 quizzes per month. Pro accounts have unlimited quiz creation, and Teams accounts include additional collaborative features for groups."
    },
    {
      question: "How accurate are the AI-generated questions?",
      answer: "Our advanced AI has been trained on educational content across various disciplines to ensure high-quality questions. The system continuously improves based on user feedback and performance data."
    },
    {
      question: "Can I use QUIZORBIS for exam preparation?",
      answer: "Absolutely! QUIZORBIS is ideal for exam preparation as it helps identify knowledge gaps and focuses your study time on areas that need improvement. Many students report significant grade improvements after using our platform."
    },
    {
      question: "Does QUIZORBIS work for all subjects?",
      answer: "Yes, QUIZORBIS works for virtually any subject. Our AI can generate questions for humanities, sciences, languages, professional certifications, and more. The system adapts to the specific terminology and concepts of each field."
    },
    {
      question: "How does the voice interaction feature work?",
      answer: "Pro and Teams users can answer questions using voice commands. Our speech recognition technology processes your spoken answers and matches them to the correct options, allowing for a hands-free learning experience."
    },
    {
      question: "Can I share quizzes with others?",
      answer: "Teams accounts allow for quiz sharing and collaborative learning. Teachers can create quizzes for students, track their progress, and identify areas where additional instruction may be needed."
    },
    {
      question: "What analytics does QUIZORBIS provide?",
      answer: "Our platform offers comprehensive analytics including performance trends, subject mastery levels, time spent, and personalized recommendations. Pro and Teams accounts receive more detailed insights and progress tracking."
    },
    {
      question: "Is my data secure?",
      answer: "We take data security seriously. All uploaded documents and user data are encrypted, and we never share your information with third parties. Our systems comply with educational privacy standards and regulations."
    },
    {
      question: "How can I get help if I have issues?",
      answer: "We offer email support for all users. Pro users receive priority support, and Teams accounts include dedicated support channels. You can also check our documentation and tutorials for quick answers to common questions."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-900 to-cyan-900 py-24">
        <div className="container px-4 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <SectionBadge className="mb-4">
              <HelpCircle className="w-4 h-4 mr-2 text-cyan-400" />
              <span className="text-sm font-medium">Support Center</span>
            </SectionBadge>
            <h1 className="text-4xl font-bold mb-6">Frequently Asked Questions</h1>
            <p className="text-xl text-white/80">
              Find answers to common questions about QUIZORBIS and how it can transform your learning experience.
            </p>
          </motion.div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container px-4 mx-auto py-20">
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * index }}
              >
                <AccordionItem value={`item-${index}`} className="border border-gray-800 rounded-lg overflow-hidden">
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
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 py-16">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto bg-black/20 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 mx-auto mb-4 text-cyan-400" />
              <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
              <p className="text-gray-300 mb-6">
                Our support team is here to help. Reach out to us for personalized assistance with any questions or issues.
              </p>
              <Button className="bg-white text-purple-900 hover:bg-gray-200 group">
                Contact Support
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FAQ; 
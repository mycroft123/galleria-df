'use client';
import React, { useState, useRef, useEffect } from 'react';
import ReportBugModal from './ReportBugModal';

const faqs = [
  {
    question: 'How to Contact Us?',
    answer: 'You can contact us via the support email or the contact form on our website.',
  },
  {
    question: 'Trust Level of Feedback Application?',
    answer: 'Our application uses secure protocols and privacy-first design to ensure trust.',
  },
  {
    question: 'How do I reset my password?',
    answer: "Click on 'Forgot Password' at login and follow the instructions sent to your email.",
  },
  {
    question: 'Can I delete my account?',
    answer: 'Yes, go to settings > account > delete account.',
  },
  {
    question: 'How to Contact Us?',
    answer: 'You can contact us via the support email or the contact form on our website. '.repeat(5),
  },
  {
    question: 'Trust Level of Feedback Application?',
    answer: 'Our application uses secure protocols and privacy-first design to ensure trust.',
  },
  {
    question: 'How to Contact Us?',
    answer: 'You can contact us via the support email or the contact form on our website.',
  },
  {
    question: 'Trust Level of Feedback Application?',
    answer: 'Our application uses secure protocols and privacy-first design to ensure trust.',
  },
  {
    question: 'How do I reset my password?',
    answer: "Click on 'Forgot Password' at login and follow the instructions sent to your email.",
  },
  {
    question: 'Can I delete my account?',
    answer: 'Yes, go to settings > account > delete account.',
  },
  {
    question: 'How to Contact Us?',
    answer: 'You can contact us via the support email or the contact form on our website.',
  },
  {
    question: 'Trust Level of Feedback Application?',
    answer: 'Our application uses secure protocols and privacy-first design to ensure trust.',
  },
  {
    question: 'How do I reset my password?',
    answer: "Click on 'Forgot Password' at login and follow the instructions sent to your email.",
  },
  {
    question: 'Can I delete my account?',
    answer: 'Yes, go to settings > account > delete account.',
  },
  {
    question: 'How to Contact Us?',
    answer: 'You can contact us via the support email or the contact form on our website. '.repeat(5),
  },
  {
    question: 'Trust Level of Feedback Application?',
    answer: 'Our application uses secure protocols and privacy-first design to ensure trust.',
  },
  {
    question: 'How to Contact Us?',
    answer: 'You can contact us via the support email or the contact form on our website.',
  },
  {
    question: 'Trust Level of Feedback Application?',
    answer: 'Our application uses secure protocols and privacy-first design to ensure trust.',
  },
  {
    question: 'How do I reset my password?',
    answer: "Click on 'Forgot Password' at login and follow the instructions sent to your email.",
  },
  {
    question: 'Can I delete my account?',
    answer: 'Yes, go to settings > account > delete account.',
  },
];

const FaqItem: React.FC<{
  faq: { question: string; answer: string };
  isOpen: boolean;
  onClick: () => void;
}> = ({ faq, isOpen, onClick }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [isOpen]);

  return (
    <div className="border border-white/20 rounded p-4">
      <button
        className="flex justify-between items-center w-full text-left font-semibold text-white"
        onClick={onClick}
      >
        {faq.question}
        <span className="ml-2 text-base md:text-xl text-gray-300">{isOpen ? '-' : '+'}</span>
      </button>

      <div
        style={{
          maxHeight: isOpen ? height : 0,
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.4s ease, opacity 0.6s ease',
          marginTop: isOpen ? '0.5rem' : '0',
        }}
        aria-hidden={!isOpen}
      >
        <div ref={contentRef} className="text-gray-300">
          {faq.answer}
        </div>
      </div>
    </div>
  );
};


const HelpPage: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(6);
  const visibleFaqs = faqs.slice(0, visibleCount);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  return (
    <>
      {/* FAQ Section */}
      <div className="w-full px-0 py-0 mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-white text-center ">FAQ&apos;s</h1>
        <p className="text-center mb-10">Everything you need to know</p>

        <div className="space-y-4">
          {visibleFaqs.map((faq, idx) => (
            <FaqItem
              key={idx}
              faq={faq}
              isOpen={openIndex === idx}
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>

        {visibleCount < faqs.length && (
          <div className="text-center mt-8">
            <button
              onClick={() => setVisibleCount((prev) => prev + 4)}
              className="gap-2 rounded-lg bg-indigo-100/5 px-3 py-2 text-base font-semibold text-white ring-1 ring-inset ring-white/10 transition-all hover:bg-indigo-100/10"
            >
              Read More
            </button>
          </div>
        )}

        {/* Bug Report Section */}
        <div className="mt-16 text-center bg-white/5 rounded-xl p-8">
          <h2 className="text-white font-semibold text-lg mb-2">Facing an Issue?</h2>
          <p className="text-gray-300 mb-4">
            If something’s not working right or you’ve spotted a bug, let us know. We’ll take a look.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2 bg-indigo-100/5 ring-1 ring-inset ring-white/10 hover:bg-indigo-100/10 text-white font-semibold rounded-lg transition-all"
          >
            Report bug
          </button>
        </div>
      </div>

      <ReportBugModal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}/>
    </>
  );
};

export default HelpPage;
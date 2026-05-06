import React from 'react';
import { FadeIn } from './FadeIn';
import { FAQItem } from './FAQItem';

const faqData = [
    {
        question: 'What is QUALIA UI?',
        answer: 'QUALIA UI is an AI-powered web testing platform that lets you describe test cases in plain English and automatically generates, runs, and validates end-to-end UI tests. No coding required.',
    },
    {
        question: 'What can QUALIA UI build?',
        answer: 'QUALIA can run complete test suites for any web application from simple click-through flows to complex multi-step workflows involving forms, authentication, shopping carts, and more.',
    },
    {
        question: 'Who uses QUALIA UI?',
        answer: 'QUALIA is built for QA engineers, frontend developers, product managers, and startups who want reliable UI test coverage without spending weeks writing test scripts manually.',
    },
    {
        question: 'Is QUALIA UI free to use?',
        answer: 'QUALIA offers a generous free tier.',
    },
    {
        question: 'Is QUALIA UI open source?',
        answer: 'QUALIA core runtime is not open source.',
    },
];

export const FAQ: React.FC = () => {
    return (
        <section id="faq" className="py-24 px-4 bg-white">
            <FadeIn className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                    <span className="inline-block text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-3 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-100">
                        FAQ
                    </span>
                    <h2 className="font-sans font-bold text-gray-900 text-4xl" style={{ letterSpacing: '-0.025em' }}>
                        Frequently Asked Questions
                    </h2>
                </div>
                <div className="flex flex-col gap-3">
                    {faqData.map((item, i) => (
                        <FadeIn key={i} delay={i * 0.07}>
                            <FAQItem question={item.question} answer={item.answer} index={i} />
                        </FadeIn>
                    ))}
                </div>
            </FadeIn>
        </section>
    );
};

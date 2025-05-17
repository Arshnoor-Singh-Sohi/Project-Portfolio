// src/components/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';

const Header = ({ darkMode, toggleDarkMode }) => {
    const [isContactOpen, setIsContactOpen] = useState(false);
    const headerRef = useRef(null);
    const { scrollY } = useScroll();

    // Transform header opacity and backdrop blur based on scroll
    const headerBackground = useTransform(
        scrollY,
        [0, 100],
        ['rgba(255, 255, 255, 0)', darkMode ? 'rgba(10, 10, 20, 0.8)' : 'rgba(255, 255, 255, 0.8)']
    );

    const headerBoxShadow = useTransform(
        scrollY,
        [0, 100],
        ['none', darkMode ? '0 5px 20px rgba(0, 0, 0, 0.2)' : '0 5px 20px rgba(0, 0, 0, 0.05)']
    );

    // Set up GSAP animations for contact elements
    useEffect(() => {
        const contactElements = document.querySelectorAll('.contact-item');

        if (isContactOpen) {
            gsap.fromTo(
                contactElements,
                { y: -20, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    stagger: 0.1,
                    duration: 0.6,
                    ease: "power3.out"
                }
            );
        }
    }, [isContactOpen]);

    return (
        <motion.header
            ref={headerRef}
            className="fixed top-0 w-full z-50"
            style={{
                background: headerBackground,
                backdropFilter: 'blur(10px)',
                boxShadow: headerBoxShadow
            }}
        >
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <motion.div
                    className="logo relative"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                    <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-400 dark:from-indigo-400 dark:to-cyan-300">
                        Arshnoor Singh Sohi
                    </span>
                </motion.div>

                <div className="flex items-center gap-4">
                    {/* Contact Button */}
                    <motion.button
                        className="contact-btn relative px-4 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-500 dark:to-blue-400 text-white overflow-hidden"
                        onClick={() => setIsContactOpen(!isContactOpen)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span className="relative z-10">
                            {isContactOpen ? 'Close' : 'Contact Me'}
                        </span>
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-blue-600 dark:from-indigo-600 dark:to-blue-500"
                            initial={{ x: '-100%' }}
                            whileHover={{ x: 0 }}
                            transition={{ duration: 0.3 }}
                        />
                    </motion.button>

                    {/* Theme Toggle */}
                    <motion.button
                        className="theme-toggle w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800"
                        onClick={toggleDarkMode}
                        whileHover={{ scale: 1.1, rotate: 180 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.4, type: "spring" }}
                    >
                        {darkMode ? (
                            <motion.svg initial={{ rotate: 180 }} animate={{ rotate: 0 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="5"></circle>
                                <line x1="12" y1="1" x2="12" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="23"></line>
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                <line x1="1" y1="12" x2="3" y2="12"></line>
                                <line x1="21" y1="12" x2="23" y2="12"></line>
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                            </motion.svg>
                        ) : (
                            <motion.svg initial={{ rotate: 180 }} animate={{ rotate: 0 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                            </motion.svg>
                        )}
                    </motion.button>

                    {/* GitHub Link */}
                    <motion.a
                        href="https://github.com/Arshnoor-Singh-Sohi"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="github-link flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        whileHover={{
                            y: -3,
                            boxShadow: darkMode ? '0 7px 15px rgba(0, 0, 0, 0.3)' : '0 7px 15px rgba(0, 0, 0, 0.1)'
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        <span>GitHub</span>
                    </motion.a>
                </div>
            </div>

            {/* Contact Panel */}
            <motion.div
                className="contact-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{
                    height: isContactOpen ? 'auto' : 0,
                    opacity: isContactOpen ? 1 : 0,
                }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
            >
                <div className="container mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="contact-item flex items-center gap-3 p-4 rounded-lg bg-white/10 backdrop-blur-md">
                        <div className="icon-wrapper rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 p-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Email</p>
                            <a href="mailto:sohi21@uwindsor.ca" className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400">
                                sohi21@uwindsor.ca
                            </a>
                        </div>
                    </div>

                    <div className="contact-item flex items-center gap-3 p-4 rounded-lg bg-white/10 backdrop-blur-md">
                        <div className="icon-wrapper rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 p-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">Mobile</p>
                            <a href="tel:+15483325999" className="font-medium hover:text-indigo-600 dark:hover:text-indigo-400">
                                +1 548 332 5999
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.header>
    );
};

export default Header;
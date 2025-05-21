// src/pages/SimplePortfolio.jsx
import React, { useState, useEffect, useRef } from 'react';
import PROJECTS from '../data/projects';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import gsap from 'gsap';
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import BubbleBackground from '../components/BubbleBackground';
import WavesBackground from '../components/WavesBackground';
import FloatingElements from '../components/FloatingElements';
import ProjectCard from '../components/ProjectCard';
import BackgroundMusic from '../components/BackgroundMusic';

// Animated title component with letter animation
const AnimatedTitle = ({ children, className }) => {
    return (
        <motion.h1 className={className}>
            {Array.from(children).map((letter, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.5,
                        delay: index * 0.05,
                        ease: [0.2, 0.65, 0.3, 0.9]
                    }}
                    style={{ display: 'inline-block' }}
                >
                    {letter === ' ' ? '\u00A0' : letter}
                </motion.span>
            ))}
        </motion.h1>
    );
};

// Scroll-triggered section component
const ScrollSection = ({ children, className }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.3 });

    return (
        <motion.section
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
        >
            {children}
        </motion.section>
    );
};

// Particle background component with 3D atom-like effect
const ParticleBackground = ({ darkMode }) => {
    const particlesInit = async (main) => {
        try {
            console.log("Initializing particles...");
            await loadFull(main);
            console.log("Particles initialized successfully");
        } catch (error) {
            console.error("Failed to initialize particles:", error);
        }
    };

    return (
        <div className="fixed inset-0" style={{ zIndex: 0, pointerEvents: "none" }}>
            <Particles
                id="tsparticles"
                init={particlesInit}
                options={{
                    fullScreen: { enable: false },
                    background: {
                        color: {
                            value: "transparent",
                        },
                    },
                    // Other options remain the same
                    fpsLimit: 120,
                    particles: {
                        color: {
                            value: darkMode ? "#8b5cf6" : "#4f46e5",
                        },
                        links: {
                            color: darkMode ? "#a78bfa" : "#6366f1",
                            distance: 150,
                            enable: true,
                            opacity: 0.5,
                            width: 1,
                        },
                        // Other particle options remain the same
                    },
                    // Other interaction options remain the same
                }}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    zIndex: 0,
                    pointerEvents: "none" // This allows clicks to pass through
                }}
            />
        </div>
    );
};

const SimplePortfolio = () => {
    // State management
    const [darkMode, setDarkMode] = useState(false);
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [featuredProjects, setFeaturedProjects] = useState([]); // Add this state for featured projects
    const [selectedTechs, setSelectedTechs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeLetter, setActiveLetter] = useState(null);
    const [techsByLetter, setTechsByLetter] = useState({});
    const [alphabet] = useState("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
    const [allTechs, setAllTechs] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef(null);

    // Setup GSAP for specific animations
    const titleRef = useRef(null);
    const projectsRef = useRef(null);

    // Toggle dark mode
    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);

        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Initialize dark mode based on system preference
    useEffect(() => {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            setDarkMode(e.matches);
            if (e.matches) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // Extract technologies from projects
    const organizeSkillsData = (projects) => {
        const techSet = new Set();
        projects.forEach(project => {
            project.techs.forEach(tech => techSet.add(tech));
        });

        const allTechs = Array.from(techSet).sort();
        const techsByLetter = {};

        alphabet.forEach(letter => {
            techsByLetter[letter] = [];
        });

        allTechs.forEach(tech => {
            const firstLetter = tech.charAt(0).toUpperCase();
            if (techsByLetter[firstLetter]) {
                techsByLetter[firstLetter].push(tech);
            }
        });

        return {
            allTechs,
            techsByLetter
        };
    };

    // Load projects data - updated to handle featured projects
    useEffect(() => {
        setTimeout(() => {
            // Ensure all projects have the required fields to prevent errors
            const updatedProjects = PROJECTS.map(project => ({
                ...project,
                isLive: project.isLive || false,
                featured: project.featured || false,
                liveUrl: project.liveUrl || ''
            }));

            setProjects(updatedProjects);
            setFilteredProjects(updatedProjects);

            // Filter out projects that are marked as featured
            const featured = updatedProjects.filter(project => project.featured);
            setFeaturedProjects(featured);

            const { allTechs, techsByLetter } = organizeSkillsData(updatedProjects);
            setTechsByLetter(techsByLetter);
            setAllTechs(allTechs);

            setIsLoading(false);
        }, 800); // Simulated loading delay
    }, []);

    // Update suggestions when search term changes
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setSuggestions([]);
            return;
        }

        const filteredSuggestions = allTechs.filter(tech =>
            tech.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setSuggestions(filteredSuggestions);
    }, [searchTerm, allTechs]);

    // Filter projects based on search, selected techs, and active letter
    useEffect(() => {
        if (projects.length === 0) return;

        let results = [...projects];

        if (searchTerm) {
            results = results.filter(project =>
                project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                project.techs.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedTechs.length > 0) {
            results = results.filter(project =>
                selectedTechs.every(tech => project.techs.includes(tech))
            );
        }

        if (activeLetter) {
            const techsForLetter = techsByLetter[activeLetter] || [];
            results = results.filter(project =>
                project.techs.some(tech => techsForLetter.includes(tech))
            );
        }

        setFilteredProjects(results);
    }, [searchTerm, selectedTechs, activeLetter, projects, techsByLetter]);

    // Handle tech selection
    const handleTechSelect = (tech) => {
        if (selectedTechs.includes(tech)) {
            setSelectedTechs(prev => prev.filter(t => t !== tech));
        } else {
            setSelectedTechs(prev => [...prev, tech]);
        }
    };

    // Handle suggestion click
    const handleSuggestionClick = (tech) => {
        if (!selectedTechs.includes(tech)) {
            setSelectedTechs(prev => [...prev, tech]);
        }
        setSearchTerm("");
        setShowSuggestions(false);
    };

    // Handle input focus
    const handleInputFocus = () => {
        if (searchTerm.trim() !== "") {
            setShowSuggestions(true);
        }
    };

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [searchRef]);

    // Get techs filtered by active letter
    const getFilteredTechs = () => {
        if (!activeLetter) return null;
        return techsByLetter[activeLetter] || [];
    };

    // Reset all filters
    const resetFilters = () => {
        setSelectedTechs([]);
        setActiveLetter(null);
        setSearchTerm('');
    };

    // Get all techs
    const getAllTechs = () => {
        const allTechs = [];
        Object.values(techsByLetter).forEach(techs => allTechs.push(...techs));
        return allTechs;
    };
    // LOADING SCREEN
    if (isLoading) {
        return (
            <motion.div
                className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center">
                    <motion.div
                        className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-6"
                        animate={{
                            rotate: 360,
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            rotate: { duration: 1, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <AnimatedTitle className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                            Loading Portfolio
                        </AnimatedTitle>
                        <p className="text-gray-600 dark:text-gray-400">
                            Preparing your experience...
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    // MAIN RENDER
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white relative overflow-x-hidden">            {/* Add particles as the first child of the main container with higher z-index container */}
            <div className="z-0 pointer-events-none">
                <ParticleBackground darkMode={darkMode} />
            </div>
            <motion.header
                className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800/50"
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                }}
            >
                <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center">
                    <motion.h1
                        className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 15
                        }}
                    >
                        Arshnoor Singh Sohi
                    </motion.h1>

                    <div className="flex items-center space-x-4 mt-2 sm:mt-0">
                        <BackgroundMusic darkMode={darkMode} />

                        <motion.a
                            href="mailto:sohi21@uwindsor.ca"
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Contact Me
                        </motion.a>

                        {/* Dark Mode Toggle */}
                        <motion.button
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700"
                            onClick={toggleDarkMode}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            {darkMode ? (
                                <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="5"></circle>
                                    <line x1="12" y1="1" x2="12" y2="3"></line>
                                    <line x1="12" y1="21" x2="12" y2="23"></line>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                                    <line x1="1" y1="12" x2="3" y2="12"></line>
                                    <line x1="21" y1="12" x2="23" y2="12"></line>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                                </svg>
                            )}
                        </motion.button>

                        {/* GitHub Link */}
                        <motion.a
                            href="https://github.com/Arshnoor-Singh-Sohi"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
                            whileHover={{ y: -5 }}
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            <span>GitHub</span>
                        </motion.a>
                    </div>
                </div>
            </motion.header>

            {/* HERO SECTION */}
            <section className="relative pt-24 pb-8 mb-8">

                <BubbleBackground darkMode={darkMode} />
                {/* <WavesBackground darkMode={darkMode} /> */}
                {/* <FloatingElements darkMode={darkMode} /> */}

                {/* Background elements */}
                <div className="bg-gradient-blob absolute top-0 right-0 -z-10 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl"></div>
                <div className="bg-gradient-blob absolute bottom-0 left-0 -z-10 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl"></div>

                {/* ScrollSection begins here */}
                <ScrollSection className="container mx-auto px-4 z-20">
                    <div className="container mx-auto px-4 z-20">
                        <AnimatedTitle
                            ref={titleRef}
                            className="text-6xl md:text-8xl font-bold text-center bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent mb-12 relative z-20"
                        >
                            MY PROJECTS
                        </AnimatedTitle>

                        <motion.p
                            className="text-xl text-center max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mb-12"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.8,
                                delay: 0.2
                            }}
                        >
                            A showcase of my GitHub repositories. Explore projects and filter by technology.
                        </motion.p>

                        {/* Search Bar with Suggestions */}
                        <motion.div
                            className="max-w-xl mx-auto mb-20"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            ref={searchRef}
                        >
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full py-3 pl-12 pr-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-md"
                                    placeholder="Search projects by name, description, or technology..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={handleInputFocus}
                                />

                                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                    <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                    </svg>
                                </div>

                                {searchTerm && (
                                    <motion.button
                                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                        onClick={() => setSearchTerm('')}
                                        whileHover={{ scale: 1.2 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </motion.button>
                                )}

                                {/* Suggestions Dropdown with Scrolling */}
                                <AnimatePresence>
                                    {showSuggestions && suggestions.length > 0 && (
                                        <motion.ul
                                            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                            style={{
                                                overflowY: 'auto',
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: darkMode ? '#4B5563 #1F2937' : '#9CA3AF #F3F4F6',
                                                paddingRight: '2px',
                                            }}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {suggestions.map((tech, index) => (
                                                <motion.li
                                                    key={tech}
                                                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200"
                                                    onClick={() => handleSuggestionClick(tech)}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.03 }}
                                                    whileHover={{ backgroundColor: darkMode ? "#374151" : "#f3f4f6" }}
                                                >
                                                    {tech}
                                                </motion.li>
                                            ))}
                                        </motion.ul>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </ScrollSection>

                {/* FILTERS SECTION */}
                <ScrollSection className="container mx-auto px-4">
                    {/* Alphabet Filter */}
                    <motion.div
                        className="mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-center text-lg font-medium mb-4">Filter by First Letter</h3>

                        <div className="flex flex-wrap justify-center gap-2">
                            {alphabet.map((letter, index) => {
                                const hasProjects = techsByLetter[letter] && techsByLetter[letter].length > 0;

                                return (
                                    <motion.button
                                        key={letter}
                                        disabled={!hasProjects}
                                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-medium 
                    ${activeLetter === letter
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                                : hasProjects
                                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed'
                                            }`}
                                        onClick={() => hasProjects && setActiveLetter(letter === activeLetter ? null : letter)}
                                        whileHover={hasProjects ? { y: -5, scale: 1.1 } : {}}
                                        whileTap={hasProjects ? { scale: 0.9 } : {}}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.01 }}
                                    >
                                        {letter}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {activeLetter && (
                            <motion.div
                                className="text-center mt-3"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <button
                                    className="text-sm text-indigo-600 dark:text-indigo-400 underline font-medium"
                                    onClick={() => setActiveLetter(null)}
                                >
                                    Clear letter filter
                                </button>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Technology Filter */}
                    <motion.div
                        className="relative my-12 px-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-center text-lg font-medium mb-4">Filter by Technology</h3>

                        <div
                            className="overflow-x-auto flex flex-wrap gap-2 py-2 max-h-36 justify-center"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {(getFilteredTechs() || getAllTechs()).map((tech, index) => (
                                <motion.button
                                    key={tech}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selectedTechs.includes(tech)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                    onClick={() => handleTechSelect(tech)}
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 + index * 0.01 }}
                                >
                                    {tech}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Active Filters */}
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        {(selectedTechs.length > 0 || activeLetter || searchTerm) ? (
                            <div>
                                <p className="mb-4 text-gray-600 dark:text-gray-400">
                                    {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
                                    {searchTerm && <span> matching "<strong>{searchTerm}</strong>"</span>}
                                    {activeLetter && <span> in category <strong>{activeLetter}</strong></span>}
                                    {selectedTechs.length > 0 && (
                                        <span> using <strong>{selectedTechs.join(', ')}</strong></span>
                                    )}
                                </p>
                                <motion.button
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Stop event from bubbling up
                                        resetFilters();
                                    }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Clear All Filters
                                </motion.button>
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400">
                                Showing all {filteredProjects.length} projects. Filter by technology or search to narrow down.
                            </p>
                        )}
                    </motion.div>
                </ScrollSection>
            </section>

            {/* FEATURED PROJECTS SECTION */}
            {!isLoading &&
                featuredProjects.length > 0 &&
                selectedTechs.length === 0 &&
                activeLetter === null &&
                searchTerm === '' && (
                    <section className="container mx-auto px-4 mb-16 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mb-8"
                        >
                            <h2 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-600 to-purple-500 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                                Featured Projects
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 text-center max-w-3xl mx-auto mb-12">
                                Highlighted projects that showcase my skills and areas of expertise. These represent some of my best work or most significant contributions.
                            </p>
                        </motion.div>

                        {/* Horizontal scrolling carousel */}
                        <div className="relative w-full overflow-hidden py-8">
                            <motion.div
                                className="flex"
                                animate={{
                                    x: [`0%`, `-${featuredProjects.length * 100}%`]
                                }}
                                transition={{
                                    x: {
                                        duration: 20 * featuredProjects.length, // Speed based on number of projects
                                        repeat: Infinity,
                                        ease: "linear",
                                        repeatType: "loop"
                                    }
                                }}
                            >
                                {/* Original featured projects */}
                                {featuredProjects.map((project, index) => (
                                    <div key={`original-${project.id}`} className="min-w-[320px] sm:min-w-[384px] md:min-w-[400px] px-4">
                                        <ProjectCard
                                            project={project}
                                            index={index}
                                            selectedTechs={selectedTechs}
                                            handleTechSelect={handleTechSelect}
                                        />
                                    </div>
                                ))}

                                {/* Duplicated projects for seamless looping */}
                                {featuredProjects.map((project, index) => (
                                    <div key={`duplicate-${project.id}`} className="min-w-[320px] sm:min-w-[384px] md:min-w-[400px] px-4">
                                        <ProjectCard
                                            project={project}
                                            index={index}
                                            selectedTechs={selectedTechs}
                                            handleTechSelect={handleTechSelect}
                                        />
                                    </div>
                                ))}
                            </motion.div>

                            {/* Add gradient overlays to suggest more content */}
                            <div className="absolute top-0 left-0 h-full w-32 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10"></div>
                            <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10"></div>
                        </div>

                        {/* Divider between Featured and All Projects */}
                        <div className="relative flex items-center my-12">
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                            <span className="flex-shrink mx-4 text-gray-600 dark:text-gray-400">All Projects</span>
                            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                        </div>
                    </section>
                )}

            {/* PROJECTS GRID */}
            <section className="container mx-auto px-4 mb-16">
                <AnimatePresence mode="wait">
                    {filteredProjects.length > 0 ? (
                        <motion.div
                            key="projects-grid"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                            variants={{
                                hidden: { y: 50, opacity: 0 },
                                visible: {
                                    y: 0,
                                    opacity: 1,
                                    transition: {
                                        type: "spring",
                                        stiffness: 100,
                                        damping: 12
                                    }
                                }
                            }}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0 }}
                        >
                            {filteredProjects.map((project, index) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    index={index}
                                    selectedTechs={selectedTechs}
                                    handleTechSelect={handleTechSelect}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="no-projects"
                            className="flex flex-col items-center justify-center py-16 text-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <svg className="w-24 h-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </motion.div>

                            <h3 className="text-2xl font-bold mb-4">
                                No projects match your filters
                            </h3>

                            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                                Try adjusting your search criteria or clearing some filters to see more projects.
                            </p>

                            <motion.button
                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium shadow-lg"
                                onClick={resetFilters}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                View All Projects
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </section>

            {/* FOOTER */}
            <motion.footer
                className="bg-gray-100 dark:bg-gray-800 py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
                            © {new Date().getFullYear()} Arshnoor Singh Sohi. All rights reserved.
                        </p>

                        <div className="flex items-center gap-4">
                            <motion.a
                                href="https://github.com/Arshnoor-Singh-Sohi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                whileHover={{ scale: 1.2 }}
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                </svg>
                            </motion.a>

                            <motion.a
                                href="mailto:sohi21@uwindsor.ca"
                                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                whileHover={{ scale: 1.2 }}
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </motion.a>

                            <motion.a
                                href="tel:+15483325999"
                                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                whileHover={{ scale: 1.2 }}
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </motion.a>
                        </div>
                    </div>
                </div>
            </motion.footer>
        </div>
    );
};

export default SimplePortfolio;
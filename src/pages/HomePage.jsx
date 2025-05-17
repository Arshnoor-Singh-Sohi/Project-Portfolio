// src/pages/HomePage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PROJECTS from '../data/projects';

const HomePage = () => {
  // State for the application
  const [darkMode, setDarkMode] = useState(false);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeLetter, setActiveLetter] = useState(null);
  const [techsByLetter, setTechsByLetter] = useState({});
  const [alphabet] = useState("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
  const [allTechs, setAllTechs] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Toggle dark mode with proper HTML element class modification
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    // This is the critical part for dark mode to work with Tailwind
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

    // Listen for changes in color scheme preference
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

  // Organize techs by first letter for A-Z filtering
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

  // Initialize projects data
  useEffect(() => {
    setTimeout(() => {
      setProjects(PROJECTS);
      setFilteredProjects(PROJECTS);

      const { allTechs, techsByLetter } = organizeSkillsData(PROJECTS);
      setTechsByLetter(techsByLetter);
      setAllTechs(allTechs);

      setIsLoading(false);
    }, 800); // Shortened loading time for better UX
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
  const searchRef = useRef(null);
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

  // Extract all unique techs from projects
  const getAllTechs = () => {
    const allTechs = [];
    Object.values(techsByLetter).forEach(techs => allTechs.push(...techs));
    return allTechs;
  };

  // Animation variants for consistent animations
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  // LOADING SCREEN
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              Loading Portfolio
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Preparing an immersive experience...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  // MAIN RENDER
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-hidden">
      {/* HEADER */}
      <motion.header
        className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md dark:shadow-gray-800/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          delay: 0.2
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
              damping: 15,
              delay: 0.4
            }}
          >
            Arshnoor Singh Sohi
          </motion.h1>

          <div className="flex items-center space-x-4 mt-2 sm:mt-0">
            <motion.a
              href="mailto:sohi21@uwindsor.ca"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
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
              whileHover={{
                scale: 1.1,
                rotate: 180,
                backgroundColor: darkMode ? "#4338ca" : "#818cf8"
              }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
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
              whileHover={{
                y: -5,
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
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
      <section className="relative py-20 mb-14 overflow-visible"> {/* Significantly increased padding and changed overflow to visible */}
        {/* Animated background elements */}
        <motion.div
          className="absolute -top-20 right-0 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl z-0"
          animate={{
            y: [0, 30, 0],
            x: [0, 20, 0],
            opacity: [0.5, 0.7, 0.5],  // Increased opacity
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className="absolute bottom-0 -left-20 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl"
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <div className="container mx-auto px-4 z-10 relative">
          <motion.h1
            className="text-5xl md:text-7xl font-bold text-center bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent mb-10 relative z-10" /* Increased margin-bottom and improved positioning */
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              damping: 12,
              stiffness: 100,
              delay: 0.3
            }}
          >
            My Projects
          </motion.h1>

          <motion.p
            className="text-xl text-center max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              damping: 12,
              stiffness: 100,
              delay: 0.5
            }}
          >
            A showcase of my GitHub repositories. Explore projects and filter by technology.
          </motion.p>

          {/* Enhanced Search Bar with Suggestions */}
          <motion.div
            className="max-w-xl mx-auto mb-16" /* Increased margin-bottom from 12 to 16 for more space */
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              damping: 12,
              stiffness: 100,
              delay: 0.7
            }}
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

              {/* Suggestions Dropdown with Explicit Scrolling */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.ul
                    className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto custom-scrollbar"
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
                    {/* Fill with dummy suggestions if needed for testing */}
                    {suggestions.length < 5 && Array(20).fill(0).map((_, idx) => (
                      <motion.li
                        key={`dummy-${idx}`}
                        className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200"
                        onClick={() => handleSuggestionClick(`Dummy Tech ${idx}`)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        whileHover={{ backgroundColor: darkMode ? "#374151" : "#f3f4f6" }}
                      >
                        Dummy Technology {idx}
                      </motion.li>
                    ))}

                    {/* Real suggestions */}
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
      </section>

      {/* FILTERS SECTION */}
      <section className="container mx-auto px-4 mb-8">
        {/* Alphabet Filter */}
        <motion.div
          className="mb-6"
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          transition={{
            delay: 0.8,
            staggerChildren: 0.05
          }}
        >
          <h3 className="text-center text-lg font-medium mb-3">Filter by First Letter</h3>

          <motion.div
            className="flex flex-wrap justify-center gap-2"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
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
                  variants={fadeInUp}
                  whileHover={hasProjects ? {
                    y: -5,
                    scale: 1.1,
                    boxShadow: "0 8px 15px rgba(79, 70, 229, 0.3)"
                  } : {}}
                  whileTap={hasProjects ? { scale: 0.9 } : {}}
                >
                  {letter}
                </motion.button>
              );
            })}
          </motion.div>

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

        {/* Technology Filter - Removed left/right arrows */}
        <motion.div
          className="relative my-6 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <h3 className="text-center text-lg font-medium mb-3">Filter by Technology</h3>

          <motion.div
            id="tech-scroll-container"
            className="overflow-x-auto flex flex-wrap gap-2 py-2 no-scrollbar max-h-36 justify-center"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            {(getFilteredTechs() || getAllTechs()).map((tech, index) => (
              <motion.button
                key={tech}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${selectedTechs.includes(tech)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                onClick={() => handleTechSelect(tech)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 1.2 + index * 0.02,
                  type: "spring",
                  stiffness: 200,
                  damping: 10
                }}
                whileHover={{
                  y: -5,
                  boxShadow: "0 8px 15px rgba(0, 0, 0, 0.1)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                {tech}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Active Filters */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          {(selectedTechs.length > 0 || activeLetter || searchTerm) ? (
            <div>
              <p className="mb-3 text-gray-600 dark:text-gray-400">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
                {searchTerm && <span> matching "<strong>{searchTerm}</strong>"</span>}
                {activeLetter && <span> in category <strong>{activeLetter}</strong></span>}
                {selectedTechs.length > 0 && (
                  <span> using <strong>{selectedTechs.join(', ')}</strong></span>
                )}
              </p>
              <motion.button
                className="px-4 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium shadow-md"
                onClick={resetFilters}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)"
                }}
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
      </section>

      {/* PROJECTS GRID */}
      <section className="container mx-auto px-4 pb-20">
        <AnimatePresence mode="wait">
          {filteredProjects.length > 0 ? (
            <motion.div
              key="projects-grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 h-full flex flex-col group"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.2 + index * 0.05,
                    type: "spring",
                    stiffness: 50,
                    damping: 8
                  }}
                  whileHover={{
                    y: -15,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    transition: {
                      type: "spring",
                      stiffness: 200,
                      damping: 15
                    }
                  }}
                >
                  <div className="relative h-56 overflow-hidden">
                    <motion.img
                      src={project.image}
                      alt={project.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                    />

                    {/* Overlay that animates in on hover - removed project title */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                    >
                      <motion.a
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium flex items-center gap-2"
                        initial={{ y: 30, opacity: 0 }}
                        whileHover={{
                          scale: 1.05,
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                        }}
                        whileInView={{ y: 0, opacity: 1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{
                          type: "spring",
                          stiffness: 200,
                          damping: 10
                        }}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                        </svg>
                        View Project
                      </motion.a>
                    </motion.div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    {/* Project title now moved here, below the image */}
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
                      {project.name}
                    </h3>

                    <p className="text-gray-700 dark:text-gray-300 mb-4 flex-grow">
                      {project.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.techs.map((tech, idx) => (
                        <motion.span
                          key={tech}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${selectedTechs.includes(tech)
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            } cursor-pointer`}
                          onClick={() => handleTechSelect(tech)}
                          whileHover={{ y: -2, scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            delay: 0.5 + idx * 0.03,
                            type: "spring",
                            stiffness: 300,
                            damping: 10
                          }}
                        >
                          {tech}
                        </motion.span>
                      ))}
                    </div>

                    <motion.a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-medium"
                      whileHover={{
                        scale: 1.03,
                        boxShadow: "0 10px 15px -3px rgba(79, 70, 229, 0.3)"
                      }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                      <span>View on GitHub</span>
                    </motion.a>
                  </div>
                </motion.div>
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
                animate={{
                  scale: [0.8, 1.2, 1],
                  opacity: 1
                }}
                transition={{
                  duration: 0.8,
                  times: [0, 0.6, 1],
                  ease: "easeOut"
                }}
              >
                <svg className="w-24 h-24 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>

              <motion.h3
                className="text-2xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                No projects match your filters
              </motion.h3>

              <motion.p
                className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Try adjusting your search criteria or clearing some filters to see more projects.
              </motion.p>

              <motion.button
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/30"
                onClick={resetFilters}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 25px -5px rgba(79, 70, 229, 0.3)"
                }}
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
        transition={{ delay: 1.5 }}
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
                whileHover={{ scale: 1.2, rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </motion.a>

              <motion.a
                href="mailto:sohi21@uwindsor.ca"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                whileHover={{ scale: 1.2, rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </motion.a>

              <motion.a
                href="tel:+15483325999"
                className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                whileHover={{ scale: 1.2, rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
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

export default HomePage;
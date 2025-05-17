// // src/pages/AnimatedPortfolio.jsx
// import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import gsap from 'gsap';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';
// import PROJECTS from '../data/projects';

// // Register only the free GSAP plugins
// gsap.registerPlugin(ScrollTrigger);

// const AnimatedPortfolio = () => {
//     // State for the application (same as before)
//     const [darkMode, setDarkMode] = useState(false);
//     const [projects, setProjects] = useState([]);
//     const [filteredProjects, setFilteredProjects] = useState([]);
//     const [selectedTechs, setSelectedTechs] = useState([]);
//     const [isLoading, setIsLoading] = useState(true);
//     const [searchTerm, setSearchTerm] = useState('');
//     const [activeLetter, setActiveLetter] = useState(null);
//     const [techsByLetter, setTechsByLetter] = useState({});
//     const [alphabet] = useState("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""));
//     const [allTechs, setAllTechs] = useState([]);
//     const [suggestions, setSuggestions] = useState([]);
//     const [showSuggestions, setShowSuggestions] = useState(false);

//     // Refs for animations
//     const headerRef = useRef(null);
//     const heroRef = useRef(null);
//     const projectsRef = useRef(null);
//     const titleRef = useRef(null);
//     const cursorRef = useRef(null);
//     const cursorDotRef = useRef(null);
//     const sectionsRef = useRef([]);
//     const mainRef = useRef(null);
//     const searchRef = useRef(null);

//     // Toggle dark mode with proper HTML element class modification
//     const toggleDarkMode = () => {
//         const newMode = !darkMode;
//         setDarkMode(newMode);

//         // Apply dark mode class
//         if (newMode) {
//             document.documentElement.classList.add('dark');
//             // Animate dark mode transition
//             gsap.to('body', {
//                 backgroundColor: '#111827',
//                 color: '#ffffff',
//                 duration: 0.6,
//                 ease: 'power2.inOut'
//             });
//         } else {
//             document.documentElement.classList.remove('dark');
//             // Animate light mode transition
//             gsap.to('body', {
//                 backgroundColor: '#ffffff',
//                 color: '#111827',
//                 duration: 0.6,
//                 ease: 'power2.inOut'
//             });
//         }
//     };

//     // Initialize dark mode based on system preference
//     useEffect(() => {
//         const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
//         if (prefersDark) {
//             setDarkMode(true);
//             document.documentElement.classList.add('dark');
//         }

//         // Listen for changes in color scheme preference
//         const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
//         const handleChange = (e) => {
//             setDarkMode(e.matches);
//             if (e.matches) {
//                 document.documentElement.classList.add('dark');
//             } else {
//                 document.documentElement.classList.remove('dark');
//             }
//         };

//         mediaQuery.addEventListener('change', handleChange);
//         return () => mediaQuery.removeEventListener('change', handleChange);
//     }, []);

//     // Initialize cursor animation
//     useEffect(() => {
//         if (cursorRef.current && cursorDotRef.current) {
//             // Mouse follower effect
//             const cursor = cursorRef.current;
//             const cursorDot = cursorDotRef.current;

//             const moveCursor = (e) => {
//                 // Animate cursor with smooth easing
//                 gsap.to(cursor, {
//                     x: e.clientX,
//                     y: e.clientY,
//                     duration: 0.3,
//                     ease: 'power2.out'
//                 });

//                 // Smaller dot follows more closely
//                 gsap.to(cursorDot, {
//                     x: e.clientX,
//                     y: e.clientY,
//                     duration: 0.1,
//                     ease: 'none'
//                 });
//             };

//             window.addEventListener('mousemove', moveCursor);

//             // Scale cursor on interactive elements
//             const handleMouseEnter = () => {
//                 gsap.to(cursor, {
//                     scale: 2.5,
//                     opacity: 0.5,
//                     duration: 0.3,
//                     ease: 'power2.out'
//                 });

//                 gsap.to(cursorDot, {
//                     scale: 0,
//                     duration: 0.3
//                 });
//             };

//             const handleMouseLeave = () => {
//                 gsap.to(cursor, {
//                     scale: 1,
//                     opacity: 1,
//                     duration: 0.3,
//                     ease: 'power2.out'
//                 });

//                 gsap.to(cursorDot, {
//                     scale: 1,
//                     duration: 0.3
//                 });
//             };

//             // Add event listeners to interactive elements
//             const interactiveElements = document.querySelectorAll('a, button, input, .interactive');
//             interactiveElements.forEach(el => {
//                 el.addEventListener('mouseenter', handleMouseEnter);
//                 el.addEventListener('mouseleave', handleMouseLeave);
//             });

//             return () => {
//                 window.removeEventListener('mousemove', moveCursor);
//                 interactiveElements.forEach(el => {
//                     el.removeEventListener('mouseenter', handleMouseEnter);
//                     el.removeEventListener('mouseleave', handleMouseLeave);
//                 });
//             };
//         }
//     }, [isLoading]);

//     // Initialize main animations - MODIFIED TO REMOVE PREMIUM PLUGINS
//     useLayoutEffect(() => {
//         if (!isLoading && titleRef.current) {
//             // Create main timeline
//             const tl = gsap.timeline();

//             // Title animation - simplified version without SplitText
//             tl.from(titleRef.current, {
//                 opacity: 0,
//                 y: 100,
//                 duration: 1.2,
//                 ease: 'back.out(1.7)'
//             });

//             // Header animation
//             tl.from(headerRef.current, {
//                 y: -100,
//                 opacity: 0,
//                 duration: 0.8,
//                 ease: 'power3.out'
//             }, "-=0.5");

//             // Create scroll animations
//             if (mainRef.current && projectsRef.current) {
//                 // Parallax effect on hero section
//                 gsap.to(heroRef.current.querySelector('.bg-gradient-blob-1'), {
//                     y: '30%',
//                     scrollTrigger: {
//                         trigger: heroRef.current,
//                         start: 'top top',
//                         end: 'bottom top',
//                         scrub: true
//                     }
//                 });

//                 gsap.to(heroRef.current.querySelector('.bg-gradient-blob-2'), {
//                     y: '50%',
//                     scrollTrigger: {
//                         trigger: heroRef.current,
//                         start: 'top top',
//                         end: 'bottom top',
//                         scrub: true
//                     }
//                 });

//                 // Animate projects when they come into view
//                 const projectItems = projectsRef.current.querySelectorAll('.project-card');
//                 projectItems.forEach((item, i) => {
//                     gsap.from(item, {
//                         y: 100,
//                         opacity: 0,
//                         duration: 0.8,
//                         ease: 'power3.out',
//                         scrollTrigger: {
//                             trigger: item,
//                             start: 'top bottom-=100',
//                             toggleActions: 'play none none none'
//                         },
//                         delay: i * 0.1
//                     });
//                 });

//                 // Animate filter sections
//                 sectionsRef.current.forEach(section => {
//                     if (section) {
//                         gsap.from(section, {
//                             y: 50,
//                             opacity: 0,
//                             duration: 0.8,
//                             ease: 'power2.out',
//                             scrollTrigger: {
//                                 trigger: section,
//                                 start: 'top bottom-=50',
//                                 toggleActions: 'play none none none'
//                             }
//                         });
//                     }
//                 });
//             }
//         }
//     }, [isLoading]);

//     // Organize techs by first letter for A-Z filtering
//     const organizeSkillsData = (projects) => {
//         const techSet = new Set();
//         projects.forEach(project => {
//             project.techs.forEach(tech => techSet.add(tech));
//         });

//         const allTechs = Array.from(techSet).sort();
//         const techsByLetter = {};

//         alphabet.forEach(letter => {
//             techsByLetter[letter] = [];
//         });

//         allTechs.forEach(tech => {
//             const firstLetter = tech.charAt(0).toUpperCase();
//             if (techsByLetter[firstLetter]) {
//                 techsByLetter[firstLetter].push(tech);
//             }
//         });

//         return {
//             allTechs,
//             techsByLetter
//         };
//     };

//     // Initialize projects data
//     useEffect(() => {
//         // Initial loading animation
//         const loadingTl = gsap.timeline();

//         loadingTl.to('.loading-screen .progress-bar', {
//             width: '100%',
//             duration: 1.5,
//             ease: 'power2.inOut',
//             onComplete: () => {
//                 setTimeout(() => {
//                     setProjects(PROJECTS);
//                     setFilteredProjects(PROJECTS);

//                     const { allTechs, techsByLetter } = organizeSkillsData(PROJECTS);
//                     setTechsByLetter(techsByLetter);
//                     setAllTechs(allTechs);

//                     setIsLoading(false);
//                 }, 300);
//             }
//         });

//         loadingTl.to('.loading-screen', {
//             opacity: 0,
//             duration: 0.5,
//             ease: 'power2.out',
//             pointerEvents: 'none'
//         });
//     }, []);

//     // Update suggestions when search term changes
//     useEffect(() => {
//         if (searchTerm.trim() === "") {
//             setSuggestions([]);
//             return;
//         }

//         const filteredSuggestions = allTechs.filter(tech =>
//             tech.toLowerCase().includes(searchTerm.toLowerCase())
//         );

//         setSuggestions(filteredSuggestions);
//     }, [searchTerm, allTechs]);

//     // Filter projects based on search, selected techs, and active letter
//     useEffect(() => {
//         if (projects.length === 0) return;

//         let results = [...projects];

//         if (searchTerm) {
//             results = results.filter(project =>
//                 project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                 project.techs.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()))
//             );
//         }

//         if (selectedTechs.length > 0) {
//             results = results.filter(project =>
//                 selectedTechs.every(tech => project.techs.includes(tech))
//             );
//         }

//         if (activeLetter) {
//             const techsForLetter = techsByLetter[activeLetter] || [];
//             results = results.filter(project =>
//                 project.techs.some(tech => techsForLetter.includes(tech))
//             );
//         }

//         // Animate the filter results
//         gsap.from('.project-card', {
//             opacity: 0,
//             y: 30,
//             stagger: 0.05,
//             duration: 0.5,
//             ease: 'power2.out',
//             clearProps: 'all'
//         });

//         setFilteredProjects(results);
//     }, [searchTerm, selectedTechs, activeLetter, projects, techsByLetter]);

//     // Handle tech selection
//     const handleTechSelect = (tech) => {
//         // Animate the selected tech
//         gsap.to(`.tech-tag:contains('${tech}')`, {
//             scale: [1, 1.2, 1],
//             duration: 0.5,
//             ease: 'elastic.out(1.2, 0.5)'
//         });

//         if (selectedTechs.includes(tech)) {
//             setSelectedTechs(prev => prev.filter(t => t !== tech));
//         } else {
//             setSelectedTechs(prev => [...prev, tech]);
//         }
//     };

//     // Handle suggestion click
//     const handleSuggestionClick = (tech) => {
//         if (!selectedTechs.includes(tech)) {
//             setSelectedTechs(prev => [...prev, tech]);
//         }
//         setSearchTerm("");
//         setShowSuggestions(false);

//         // Animate suggestion selection
//         gsap.to(searchRef.current, {
//             scale: [1, 1.05, 1],
//             duration: 0.4,
//             ease: 'elastic.out(1.2, 0.5)'
//         });
//     };

//     // Handle input focus
//     const handleInputFocus = () => {
//         if (searchTerm.trim() !== "") {
//             setShowSuggestions(true);
//         }
//     };

//     // Handle click outside to close suggestions
//     useEffect(() => {
//         const handleClickOutside = (event) => {
//             if (searchRef.current && !searchRef.current.contains(event.target)) {
//                 setShowSuggestions(false);
//             }
//         };

//         document.addEventListener("mousedown", handleClickOutside);
//         return () => {
//             document.removeEventListener("mousedown", handleClickOutside);
//         };
//     }, [searchRef]);

//     // Get techs filtered by active letter
//     const getFilteredTechs = () => {
//         if (!activeLetter) return null;
//         return techsByLetter[activeLetter] || [];
//     };

//     // Reset all filters
//     const resetFilters = () => {
//         // Animate reset
//         gsap.to('.filter-controls', {
//             scale: [1, 1.03, 1],
//             duration: 0.5,
//             ease: 'elastic.out(1.2, 0.5)'
//         });

//         setSelectedTechs([]);
//         setActiveLetter(null);
//         setSearchTerm('');
//     };

//     // Extract all unique techs from projects
//     const getAllTechs = () => {
//         const allTechs = [];
//         Object.values(techsByLetter).forEach(techs => allTechs.push(...techs));
//         return allTechs;
//     };

//     // Animation variants for consistent animations
//     const fadeInUp = {
//         hidden: { opacity: 0, y: 30 },
//         visible: {
//             opacity: 1,
//             y: 0,
//             transition: {
//                 type: "spring",
//                 stiffness: 300,
//                 damping: 15
//             }
//         }
//     };

//     const staggerContainer = {
//         hidden: { opacity: 0 },
//         visible: {
//             opacity: 1,
//             transition: {
//                 staggerChildren: 0.1
//             }
//         }
//     };

//     // LOADING SCREEN
//     if (isLoading) {
//         return (
//             <div className="loading-screen min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
//                 <motion.div
//                     className="text-center"
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ duration: 0.5 }}
//                 >
//                     <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent mb-8">
//                         Arshnoor Singh Sohi
//                     </h1>

//                     <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mx-auto mb-4">
//                         <div className="progress-bar h-full w-0 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full"></div>
//                     </div>

//                     <p className="text-gray-400">Loading experience...</p>
//                 </motion.div>
//             </div>
//         );
//     }

//     // MAIN RENDER
//     return (
//         <div ref={mainRef} className="relative min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white overflow-x-hidden">
//             {/* Custom Cursor */}
//             <div
//                 ref={cursorRef}
//                 className="fixed w-8 h-8 bg-indigo-500 rounded-full pointer-events-none opacity-50 mix-blend-difference z-[9999] transform -translate-x-1/2 -translate-y-1/2 hidden md:block"
//                 style={{ left: '-100px', top: '-100px' }}
//             ></div>
//             <div
//                 ref={cursorDotRef}
//                 className="fixed w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] transform -translate-x-1/2 -translate-y-1/2 hidden md:block"
//                 style={{ left: '-100px', top: '-100px' }}
//             ></div>

//             {/* HEADER */}
//             <header
//                 ref={headerRef}
//                 className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md dark:shadow-gray-800/30"
//             >
//                 <div className="container mx-auto px-4 py-4 flex flex-wrap justify-between items-center">
//                     <h1
//                         className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent"
//                     >
//                         Arshnoor Singh Sohi
//                     </h1>

//                     <div className="flex items-center space-x-4 mt-2 sm:mt-0">

//                         href="mailto:sohi21@uwindsor.ca"
//                         className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium interactive"
//             >
//                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                         </svg>
//                         Contact Me
//                     </a>

//                     {/* Dark Mode Toggle */}
//                     <button
//                         className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 interactive"
//                         onClick={toggleDarkMode}
//                     >
//                         {darkMode ? (
//                             <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <circle cx="12" cy="12" r="5"></circle>
//                                 <line x1="12" y1="1" x2="12" y2="3"></line>
//                                 <line x1="12" y1="21" x2="12" y2="23"></line>
//                                 <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
//                                 <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
//                                 <line x1="1" y1="12" x2="3" y2="12"></line>
//                                 <line x1="21" y1="12" x2="23" y2="12"></line>
//                                 <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
//                                 <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
//                             </svg>
//                         ) : (
//                             <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                 <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
//                             </svg>
//                         )}
//                     </button>

//                     {/* GitHub Link */}
//                     <a
//                         href="https://github.com/Arshnoor-Singh-Sohi"
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg interactive"
//                     >
//                         <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
//                             <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
//                         </svg>
//                         <span>GitHub</span>
//                     </a>
//                 </div>
//         </div>
//       </header >

//     {/* HERO SECTION */ }
//     < section
// ref = { heroRef }
// className = "relative py-32 overflow-visible"
//     >
//     {/* Animated background elements */ }
//     < div
// className = "bg-gradient-blob-1 absolute -top-20 right-0 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-900/20 rounded-full blur-3xl"
//     ></ >
        
//         <div 
//           className="bg-gradient-blob-2 absolute bottom-0 -left-20 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl"
//         ></div>
        
//         <div className="container mx-auto px-4 z-10 relative">
//           <h1 
//             ref={titleRef}
//             className="title-text text-7xl md:text-9xl font-bold text-center bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent mb-10 relative z-20"
//           >
//             MY PROJECTS
//           </h1>
          
//           <p 
//             className="subtitle-text text-xl text-center max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mb-16"
//           >
//             A showcase of my GitHub repositories. Explore projects and filter by technology.
//           </p>
          
//           {/* Enhanced Search Bar with Suggestions */}
//           <div 
//             className="search-container max-w-xl mx-auto mb-16"
//             ref={searchRef}
//           >
//             <div className="relative">
//               <input
//                 type="text"
//                 className="w-full py-3 pl-12 pr-10 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg interactive"
//                 placeholder="Search projects by name, description, or technology..."
//                 value={searchTerm}
//                 onChange={(e) => {
//                   setSearchTerm(e.target.value);
//                   setShowSuggestions(true);
//                 }}
//                 onFocus={handleInputFocus}
//               />
              
//               <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
//                 <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
//                 </svg>
//               </div>
              
//               {searchTerm && (
//                 <button 
//                   className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 interactive"
//                   onClick={() => setSearchTerm('')}
//                 >
//                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
//                   </svg>
//                 </button>
//               )}
              
//               {/* Suggestions Dropdown */}
//               <AnimatePresence>
//                 {showSuggestions && suggestions.length > 0 && (
//                   <motion.ul 
//                     className="absolute z-50 w-full mt-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
//                     style={{
//                       overflowY: 'auto',
//                       scrollbarWidth: 'thin',
//                       scrollbarColor: darkMode ? '#4B5563 #1F2937' : '#9CA3AF #F3F4F6',
//                       paddingRight: '2px',
//                     }}
//                     initial={{ opacity: 0, y: -10 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -10 }}
//                     transition={{ duration: 0.2 }}
//                   >
//                     {/* Real suggestions */}
//                     {suggestions.map((tech, index) => (
//                       <motion.li 
//                         key={tech}
//                         className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200 interactive"
//                         onClick={() => handleSuggestionClick(tech)}
//                         initial={{ opacity: 0, x: -10 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ delay: index * 0.03 }}
//                         whileHover={{ backgroundColor: darkMode ? "#374151" : "#f3f4f6" }}
//                       >
//                         {tech}
//                       </motion.li>
//                     ))}
                    
//                     {/* Fill with dummy suggestions if needed for testing */}
//                     {suggestions.length < 5 && Array(Math.max(0, 5 - suggestions.length)).fill(0).map((_, idx) => (
//                       <motion.li 
//                         key={`dummy-${idx}`}
//                         className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-800 dark:text-gray-200 interactive"
//                         onClick={() => handleSuggestionClick(`Dummy Tech ${idx}`)}
//                         initial={{ opacity: 0, x: -10 }}
//                         animate={{ opacity: 1, x: 0 }}
//                         transition={{ delay: (suggestions.length + idx) * 0.03 }}
//                         whileHover={{ backgroundColor: darkMode ? "#374151" : "#f3f4f6" }}
//                       >
//                         Suggested Technology {idx + 1}
//                       </motion.li>
//                     ))}
//                   </motion.ul>
//                 )}
//               </AnimatePresence>
//             </div>
//           </div>
//         </div>

// {/* Decorative elements */ }
//         <div className="absolute bottom-10 left-10 w-20 h-20 border-2 border-indigo-500/20 rounded-full animate-pulse"></div>
//         <div className="absolute top-20 right-20 w-32 h-32 border-2 border-blue-500/20 rounded-full animate-pulse"></div>
//       </section >

//     {/* FILTERS SECTION */ }
//     < section
// ref = { el => sectionsRef.current[0] = el }
// className = "filter-section container mx-auto px-4 mb-12"
//     >
//     {/* Alphabet Filter */ }
//     < div className = "filter-controls mb-8" >
//           <h3 className="text-center text-xl font-medium mb-3 relative">
//             <span className="relative inline-block">
//               Filter by First Letter
//               <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
//             </span>
//           </h3>
          
//           <div 
//             className="flex flex-wrap justify-center gap-2"
//           >
//             {alphabet.map((letter, index) => {
//               const hasProjects = techsByLetter[letter] && techsByLetter[letter].length > 0;
              
//               return (
//                 <button
//                   key={letter}
//                   disabled={!hasProjects}
//                   className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-medium interactive
//                     ${activeLetter === letter 
//                       ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
//                       : hasProjects 
//                         ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700' 
//                         : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 opacity-40 cursor-not-allowed'
//                     }`}
//                   onClick={() => hasProjects && setActiveLetter(letter === activeLetter ? null : letter)}
//                 >
//                   {letter}
//                 </button>
//               );
//             })}
//           </div>

// {
//     activeLetter && (
//         <div
//             className="text-center mt-3"
//         >
//             <button
//                 className="text-sm text-indigo-600 dark:text-indigo-400 underline font-medium interactive"
//                 onClick={() => setActiveLetter(null)}
//             >
//                 Clear letter filter
//             </button>
//         </div>
//     )
// }
//         </ >

//     {/* Technology Filter */ }
//     < div
// ref = { el => sectionsRef.current[1] = el }
// className = "filter-controls relative my-8 px-4"
//     >
//           <h3 className="text-center text-xl font-medium mb-3 relative">
//             <span className="relative inline-block">
//               Filter by Technology
//               <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform"></div>
//             </span>
//           </h3>
          
//           <div 
//             id="tech-scroll-container"
//             className="overflow-x-auto flex flex-wrap gap-2 py-2 no-scrollbar max-h-36 justify-center"
//             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
//           >
//             {(getFilteredTechs() || getAllTechs()).map((tech, index) => (
//               <button
//                 key={tech}
//                 className={`tech-tag px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap interactive ${
//                   selectedTechs.includes(tech) 
//                     ? 'bg-indigo-600 text-white' 
//                     : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
//                 }`}
//                 onClick={() => handleTechSelect(tech)}
//               >
//                 {tech}
//               </button>
//             ))}
//           </div>
//         </div >

//     {/* Active Filters */ }
//     < div
// ref = { el => sectionsRef.current[2] = el }
// className = "filter-controls text-center mb-8"
//     >
//     {(selectedTechs.length > 0 || activeLetter || searchTerm) ? (
//     <div>
//         <p className="mb-3 text-gray-600 dark:text-gray-400">
//             {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
//             {searchTerm && <span> matching "<strong>{searchTerm}</strong>"</span>}
//             {activeLetter && <span> in category <strong>{activeLetter}</strong></span>}
//             {selectedTechs.length > 0 && (
//                 <span> using <strong>{selectedTechs.join(', ')}</strong></span>
//             )}
//         </p>
//         <button
//             className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-full text-sm font-medium shadow-lg hover:shadow-indigo-500/30 interactive"
//             onClick={resetFilters}
//         >
//             Clear All Filters
//         </button>
//     </div>
// ) : (
//     <p className="text-gray-600 dark:text-gray-400">
//         Showing all {filteredProjects.length} projects. Filter by technology or search to narrow down.
//     </p>
// )}
//         </div >
//       </section >

//     {/* PROJECTS GRID */ }
//     < section
// ref = { projectsRef }
// className = "container mx-auto px-4 pb-32"
//     >
//     <AnimatePresence mode="wait">
//         {filteredProjects.length > 0 ? (
//             <div
//                 key="projects-grid"
//                 className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
//             >
//                 {filteredProjects.map((project, index) => (
//                     <div
//                         key={project.id}
//                         className="project-card bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 h-full flex flex-col group"
//                     >
//                         <div className="relative h-56 overflow-hidden">
//                             <img
//                                 // Adjust image path to match your data structure
//                                 src={project.image.replace('/public', '')}
//                                 alt={project.name}
//                                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
//                             />

//                             {/* Overlay that animates in on hover */}
//                             <div
//                                 className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
//                             >
//                                 <a
//                                     href={project.repoUrl}
//                                     target="_blank"
//                                     rel="noopener noreferrer"
//                                     className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium flex items-center gap-2 transform translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 interactive"
//                                 >
//                                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//                                         <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
//                                     </svg>
//                                     View Project
//                                 </a>
//                             </div>
//                         </div>

//                         <div className="p-6 flex flex-col flex-grow">
//                             {/* Project title now placed below the image */}
//                             <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
//                                 {project.name}
//                             </h3>

//                             <p className="text-gray-700 dark:text-gray-300 mb-4 flex-grow">
//                                 {project.description}
//                             </p>

//                             <div className="flex flex-wrap gap-2 mb-4">
//                                 {project.techs.map((tech, idx) => (
//                                     <span
//                                         key={tech}
//                                         className={`tech-tag px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-all duration-300 ${selectedTechs.includes(tech)
//                                             ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
//                                             : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
//                                             } interactive`}
//                                         onClick={() => handleTechSelect(tech)}
//                                     >
//                                         {tech}
//                                     </span>
//                                 ))}
//                             </div>

//                             <a
//                                 href={project.repoUrl}
//                                 target="_blank"
//                                 rel="noopener noreferrer"
//                                 className="mt-auto flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 dark:from-indigo-500 dark:to-blue-400 text-white rounded-lg font-medium transition-all duration-300 interactive"
//                             >
//                                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
//                                     <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
//                                 </svg>
//                                 <span>View on GitHub</span>
//                             </a>
//                         </div>
//                     </div>
//                 ))}
//             </div>
//         ) : (
//             <div
//                 key="no-projects"
//                 className="flex flex-col items-center justify-center py-16 text-center"
//             >
//                 <div
//                     className="w-24 h-24 text-gray-400 dark:text-gray-600 mb-4"
//                 >
//                     <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                 </div>

//                 <h3
//                     className="text-2xl font-bold mb-4"
//                 >
//                     No projects match your filters
//                 </h3>

//                 <p
//                     className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto"
//                 >
//                     Try adjusting your search criteria or clearing some filters to see more projects.
//                 </p>

//                 <button
//                     className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg font-medium shadow-lg interactive"
//                     onClick={resetFilters}
//                 >
//                     View All Projects
//                 </button>
//             </div>
//         )}
//     </AnimatePresence>
//     </section >

//     {/* FOOTER */ }
//     < footer
// className = "relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 py-12"
//     >
//     <div className="container mx-auto px-4">
//         <div className="flex flex-col md:flex-row justify-between items-center">
//             <p className="text-gray-600 dark:text-gray-400 mb-4 md:mb-0">
//                 © {new Date().getFullYear()} Arshnoor Singh Sohi. All rights reserved.
//             </p>

//             <div className="flex items-center gap-4">
//                 <a
//                     href="https://github.com/Arshnoor-Singh-Sohi"
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors interactive"
//                 >
//                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
//                         <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
//                     </svg>
//                 </a>

//                 <a
//                     href="mailto:sohi21@uwindsor.ca"
//                     className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors interactive"
//                 >
//                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//                     </svg>
//                 </a>

//                 <a
//                     href="tel:+15483325999"
//                     className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors interactive"
//                 >
//                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
//                     </svg>
//                 </a>
//             </div>
//         </div>
//     </div>

// {/* Footer decorative elements */ }
// <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-600"></div>
//       </footer >
//     </div >
//   );
// };

// export default AnimatedPortfolio;
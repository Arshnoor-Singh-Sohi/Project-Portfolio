import React, { useState, useEffect, useRef } from 'react';
import PROJECTS from '../data/projects';
import '../Portfolio.css';

// Extract technologies helper function - enhanced to include first letter for A-Z filtering
const organizeSkillsData = (projects) => {
  // Get all unique technologies
  const techSet = new Set();
  projects.forEach(project => {
    project.techs.forEach(tech => techSet.add(tech));
  });
  
  // Convert to array and sort alphabetically
  const allTechs = Array.from(techSet).sort();
  
  // Organize by first letter for A-Z filtering
  const techsByLetter = {};
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  
  // Initialize all letters
  alphabet.forEach(letter => {
    techsByLetter[letter] = [];
  });
  
  // Group technologies by first letter
  allTechs.forEach(tech => {
    const firstLetter = tech.charAt(0).toUpperCase();
    if (techsByLetter[firstLetter]) {
      techsByLetter[firstLetter].push(tech);
    }
  });
  
  return {
    allTechs,
    techsByLetter,
    alphabet
  };
};

// Skeleton loader component for project cards
const SkeletonCard = () => (
  <div className="project-card skeleton-card">
    <div className="skeleton-image"></div>
    <div className="skeleton-content">
      <div className="skeleton-title"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-tags">
        <div className="skeleton-tag"></div>
        <div className="skeleton-tag"></div>
        <div className="skeleton-tag"></div>
      </div>
      <div className="skeleton-button"></div>
    </div>
  </div>
);

// Project Card Component
const ProjectCard = ({ project }) => {
  return (
    <div className="project-card">
      <div className="project-image">
        <img src={project.image} alt={project.name} />
        <div className="project-overlay">
          <a 
            href={project.repoUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="view-project-btn"
          >
            View Project
          </a>
        </div>
      </div>
      
      <div className="project-content">
        <h3 className="project-title">{project.name}</h3>
        <p className="project-description">{project.description}</p>
        
        <div className="tech-tags">
          {project.techs.map(tech => (
            <span 
              key={tech} 
              className="tech-tag"
            >
              {tech}
            </span>
          ))}
        </div>
        
        <a 
          href={project.repoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="github-button"
        >
          <svg className="w-4 h-4" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>View on GitHub</span>
        </a>
      </div>
    </div>
  );
};

// A-Z Letter Filter Component
const AlphabetFilter = ({ alphabet, activeLetter, setActiveLetter, techsByLetter }) => {
  return (
    <div className="alphabet-filter">
      <div className="letter-container">
        {alphabet.map(letter => {
          // Check if there are any technologies starting with this letter
          const hasItems = techsByLetter[letter] && techsByLetter[letter].length > 0;
          
          return (
            <button
              key={letter}
              className={`letter-pill ${activeLetter === letter ? 'active' : ''} ${!hasItems ? 'disabled' : ''}`}
              onClick={() => hasItems && setActiveLetter(letter === activeLetter ? null : letter)}
              disabled={!hasItems}
            >
              {letter}
            </button>
          );
        })}
      </div>
      
      {activeLetter && (
        <button 
          className="reset-filter"
          onClick={() => setActiveLetter(null)}
        >
          Clear filter
        </button>
      )}
    </div>
  );
};

// SearchBar Component
const SearchBar = ({ skills, onSelectSkill }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Update suggestions when the query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSuggestions([]);
      return;
    }
    
    const filteredSuggestions = skills.filter(skill => 
      skill.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSuggestions(filteredSuggestions);
  }, [searchQuery, skills]);
  
  // Handle input change
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };
  
  // Handle suggestion click
  const handleSuggestionClick = (skill) => {
    onSelectSkill(skill);
    setSearchQuery("");
    setShowSuggestions(false);
  };
  
  // Handle input focus
  const handleInputFocus = () => {
    if (searchQuery.trim() !== "") {
      setShowSuggestions(true);
    }
  };
  
  // Handle outside click to close suggestions
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
  
  return (
    <div className="search-container" ref={searchRef}>
      <div className="search-input-wrapper">
        <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24">
          <path d="M21.71 20.29L18 16.61A9 9 0 1 0 16.61 18l3.68 3.68a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.39zM11 18a7 7 0 1 1 7-7 7 7 0 0 1-7 7z" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
        />
        {searchQuery && (
          <button 
            className="clear-search" 
            onClick={() => setSearchQuery("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map(skill => (
            <li 
              key={skill} 
              className="suggestion-item"
              onClick={() => handleSuggestionClick(skill)}
            >
              {skill}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Skills Showcase Component with horizontal scrolling
const SkillsShowcase = ({ skills, selectedSkills, handleSkillSelect, filteredByLetter }) => {
  const scrollContainerRef = useRef(null);
  
  // Scroll functionality
  const scroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  return (
    <div className="skills-showcase">
      <div className="scroll-buttons">
        <button 
          className="scroll-button left" 
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          &lt;
        </button>
        
        <div className="skills-scroll-container" ref={scrollContainerRef}>
          {(filteredByLetter || skills).map(skill => (
            <button
              key={skill}
              className={`skill-tag ${selectedSkills.includes(skill) ? 'active' : ''}`}
              onClick={() => handleSkillSelect(skill)}
            >
              {skill}
            </button>
          ))}
        </div>
        
        <button 
          className="scroll-button right" 
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

// Toggle for dark/light mode
const ThemeToggle = ({ darkMode, toggleDarkMode }) => {
  return (
    <button 
      className="theme-toggle" 
      onClick={toggleDarkMode}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  );
};

// Main Portfolio Component
const PortfolioPage = () => {
  // State management
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [skillsData, setSkillsData] = useState({ allTechs: [], techsByLetter: {}, alphabet: [] });
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [activeLetter, setActiveLetter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // Toggle Dark Mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Load projects and extract skills data
  useEffect(() => {
    const loadData = async () => {
      try {
        // In a real app, you would fetch data from an API
        // Simulating API call delay
        setTimeout(() => {
          setProjects(PROJECTS);
          setFilteredProjects(PROJECTS);
          setSkillsData(organizeSkillsData(PROJECTS));
          setIsLoading(false);
        }, 1500);
      } catch (error) {
        console.error("Error loading projects:", error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Filter projects when skills change
  useEffect(() => {
    if (selectedSkills.length === 0 && !activeLetter) {
      setFilteredProjects(projects);
    } else {
      let filtered = projects;
      
      // Filter by selected skills if any
      if (selectedSkills.length > 0) {
        filtered = filtered.filter(project => 
          selectedSkills.every(skill => project.techs.includes(skill))
        );
      }
      
      // Additional filter by letter if active
      if (activeLetter) {
        const skillsStartingWithLetter = skillsData.techsByLetter[activeLetter] || [];
        filtered = filtered.filter(project => 
          project.techs.some(tech => skillsStartingWithLetter.includes(tech))
        );
      }
      
      setFilteredProjects(filtered);
    }
  }, [selectedSkills, activeLetter, projects, skillsData]);
  
  // Get skills filtered by active letter
  const getSkillsFilteredByLetter = () => {
    if (!activeLetter) return null;
    return skillsData.techsByLetter[activeLetter] || [];
  };
  
  // Handle skill selection
  const handleSkillSelect = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSelectedSkills([]);
    setActiveLetter(null);
  };
  
  // Render loading state with skeleton cards
  if (isLoading) {
    return (
      <div className={`portfolio ${darkMode ? 'dark-mode' : 'light-mode'}`}>
        <header className="sticky-header">
          <div className="container header-container">
            <div className="logo">Arshnoor Singh Sohi</div>
            <div className="header-actions">
              <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              <a 
                href="https://github.com/Arshnoor-Singh-Sohi" 
                target="_blank" 
                rel="noopener noreferrer"
                className="github-link"
              >
                <svg className="w-4 h-4" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </a>
            </div>
          </div>
        </header>
        
        <main className="container">
          <section className="title-section">
            <h1>My Projects</h1>
            <div className="skeleton-loader-container">
              <div className="skeleton-text-large"></div>
              <div className="skeleton-filter"></div>
              <div className="skeleton-skills"></div>
            </div>
          </section>
          
          <section className="projects-section">
            <div className="projects-grid">
              {[1, 2, 3, 4].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </section>
        </main>
        
        <footer>
          <div className="container">
            <p>© {new Date().getFullYear()} Arshnoor Singh Sohi. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }
  
  // Main render with loaded content
  return (
    <div className={`portfolio ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Header/Navigation - Sticky with transparency effect */}
      <header className="sticky-header">
        <div className="container header-container">
          <div className="logo">Arshnoor Singh Sohi</div>
          <div className="header-actions">
            <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
            <a 
              href="https://github.com/Arshnoor-Singh-Sohi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="github-link"
            >
              <svg className="w-4 h-4" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </header>
      
      <main className="container">
        {/* Title and Description Section */}
        <section className="title-section">
          <h1>My Projects</h1>
          <p className="description">
            A showcase of my GitHub repositories. Filter by technology or browse alphabetically.
          </p>
          
          {/* Add Search Bar Here */}
          <SearchBar 
            skills={skillsData.allTechs} 
            onSelectSkill={(skill) => {
              // Check if skill is already selected
              if (!selectedSkills.includes(skill)) {
                setSelectedSkills([...selectedSkills, skill]);
              }
            }} 
          />

          {/* A-Z Alphabet Filter */}
          <div>
            <AlphabetFilter 
              alphabet={skillsData.alphabet}
              activeLetter={activeLetter}
              setActiveLetter={setActiveLetter}
              techsByLetter={skillsData.techsByLetter}
            />
          </div>
          
          {/* Skills Showcase */}
          <div>
            <SkillsShowcase 
              skills={skillsData.allTechs}
              selectedSkills={selectedSkills}
              handleSkillSelect={handleSkillSelect}
              filteredByLetter={getSkillsFilteredByLetter()}
            />
          </div>
          
          {/* Active Filters Info */}
          <div className="filter-info">
            {(selectedSkills.length > 0 || activeLetter) ? (
              <div className="active-filters">
                {activeLetter && (
                  <p>Filtering by letter: <strong>{activeLetter}</strong></p>
                )}
                
                {selectedSkills.length > 0 && (
                  <p>Selected skills: <strong>{selectedSkills.join(', ')}</strong></p>
                )}
                
                <button
                  onClick={resetFilters}
                  className="clear-filters-btn"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <p>Showing all projects. Select technologies or filter by letter.</p>
            )}
          </div>
        </section>
        
        {/* Projects Grid */}
        <section className="projects-section">
          <div className="projects-grid">
            {filteredProjects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project}
              />
            ))}
            
            {filteredProjects.length === 0 && (
              <div className="no-projects">
                <p>No projects match the selected filters.</p>
                <button
                  onClick={resetFilters}
                  className="reset-button"
                >
                  View All Projects
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer>
        <div className="container">
          <p>© {new Date().getFullYear()} Arshnoor Singh Sohi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PortfolioPage;
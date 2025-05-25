import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useAnimationFrame } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import SimplePortfolio from './SimplePortfolio';

// 3D Animated Sphere Component
const AnimatedSphere = () => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 100, 200]} scale={2.5}>
      <MeshDistortMaterial
        color="#8352FD"
        attach="material"
        distort={0.3}
        speed={1.5}
        roughness={0}
      />
    </Sphere>
  );
};

// Magnetic Button Component
const MagneticButton = ({ children, className, onClick }) => {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - left - width / 2) * 0.2;
    const y = (clientY - top - height / 2) * 0.2;
    setPosition({ x, y });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      className={className}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.button>
  );
};

// Floating Navigation Component
const FloatingNav = ({ activeSection }) => {
  const navItems = ['Home', 'About', 'Projects', 'Blog', 'Certifications', 'Contact'];
  
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-8"
    >
      <motion.div
        className="bg-black/10 backdrop-blur-xl rounded-full px-8 py-4 border border-white/10"
        whileHover={{ scale: 1.02 }}
      >
        <ul className="flex gap-8">
          {navItems.map((item, index) => (
            <motion.li key={item}>
              <a
                href={`#${item.toLowerCase()}`}
                className={`text-sm font-medium transition-colors ${
                  activeSection === item.toLowerCase() ? 'text-white' : 'text-white/60'
                } hover:text-white`}
              >
                {item}
              </a>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </motion.nav>
  );
};

// Certification Card Component
const CertificationCard = ({ cert, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -10 }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition duration-500" />
      <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">{cert.name}</h3>
            <p className="text-white/60 text-sm">{cert.issuer}</p>
          </div>
        </div>
        <p className="text-white/80 text-sm">{cert.date}</p>
      </div>
    </motion.div>
  );
};

// Main Portfolio Component
const AwwardsPortfolio = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cursorRef = useRef(null);
  const { scrollYProgress } = useScroll();

  const [showSimplePortfolio, setShowSimplePortfolio] = useState(false);
  
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Custom Cursor
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Effect to handle browser back/forward and initial load based on URL hash
  useEffect(() => {
    const handlePopState = () => {
      // When browser back/forward is used, location.hash will be updated
      // *before* popstate fires.
      if (window.location.hash === '#projects') {
        setShowSimplePortfolio(true);
      } else {
        setShowSimplePortfolio(false);
      }
    };

    // Check initial URL hash on component mount
    if (window.location.hash === '#projects') {
      setShowSimplePortfolio(true);
    } else {
      // Ensure the main portfolio view is represented by the base URL (no hash or a different one)
      // And replace the current history state to reflect this initial view.
      // This removes any unwanted hash if the page is loaded directly, e.g., example.com/ instead of example.com/#
      window.history.replaceState({ view: 'mainPortfolio' }, 'Main Portfolio', window.location.pathname + window.location.search);
    }

    // Listen for popstate events (browser back/forward button clicks)
    window.addEventListener('popstate', handlePopState);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

  // Certifications data
  const certifications = [
    { name: "Advanced Java Development", issuer: "Oracle", date: "December 2023" },
    { name: "Full Stack Web Development", issuer: "Venus Multi Media", date: "December 2023" },
    { name: "Machine Learning Certification", issuer: "Venus Multi Media", date: "August 2022" },
    { name: "Cybersecurity Workshop", issuer: "EC-Council", date: "2025" },
    { name: "NLP & LLM Workshop Winner", issuer: "University of Windsor", date: "Winter 2025" }
  ];

  // Medium articles data
  const articles = [
    {
      title: "Building Scalable RAG Systems",
      excerpt: "Exploring advanced techniques for Retrieval-Augmented Generation...",
      date: "March 2024",
      readTime: "8 min read"
    },
    {
      title: "The Future of AI in Software Development",
      excerpt: "How artificial intelligence is reshaping the way we build software...",
      date: "February 2024",
      readTime: "6 min read"
    },
    {
      title: "Distributed Systems: A Practical Guide",
      excerpt: "Understanding the complexities of building distributed applications...",
      date: "January 2024",
      readTime: "12 min read"
    }
  ];

  // 3. Handler to show SimplePortfolio
  const handleSeeMyProjectsClick = () => {
    setShowSimplePortfolio(true);
    // Push a new state to history, changing the URL hash
    window.history.pushState({ view: 'simplePortfolio' }, 'Projects', '#projects');
  };

  // 5. Handler to go back to the main portfolio (to be passed to SimplePortfolio)
  const handleBackToMainPortfolio = () => {
    setShowSimplePortfolio(false);
    // Optionally, reset scroll position or active section
    // window.scrollTo(0, 0);
    // setActiveSection('home'); 
    window.history.back();
  };

  // 4. Conditional rendering
  if (showSimplePortfolio) {
    // Pass the handler to SimplePortfolio so it can navigate back
    return <SimplePortfolio onBack={handleBackToMainPortfolio} />;
  }

  return (
    <div className="bg-black text-white overflow-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Custom Cursor */}
      <motion.div
        ref={cursorRef}
        className="fixed w-6 h-6 bg-white rounded-full pointer-events-none z-50 mix-blend-difference"
        animate={{ x: mousePosition.x - 12, y: mousePosition.y - 12 }}
        transition={{ type: "spring", stiffness: 500, damping: 28 }}
      />

      {/* Floating Navigation */}
      <FloatingNav activeSection={activeSection} />

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <AnimatedSphere />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="relative inline-block mb-8"
          >
            {/* <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-2xl opacity-50" />
            <img
              src="/public/assets/images/profile.jpg"
              alt="Arshnoor Singh Sohi"
              className="relative w-48 h-48 rounded-full border-4 border-white/20"
            /> */}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-7xl md:text-9xl font-bold mb-4"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              ʌɾƨɦɲооɾ
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl md:text-3xl text-white/60 font-light mb-8"
          >
            Software Engineer • AI Enthusiast • Creative Developer
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4 justify-center"
          >
            <MagneticButton
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-medium hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
              onClick={handleSeeMyProjectsClick}
            >
              See My Projects
            </MagneticButton>
            <MagneticButton
              className="px-8 py-4 bg-white/10 backdrop-blur-xl rounded-full font-medium border border-white/20 hover:bg-white/20 transition-all duration-300"
              onClick={() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })}
            >
              Get In Touch
            </MagneticButton>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="grid md:grid-cols-2 gap-16 items-center"
          >
            <div>
              <h2 className="text-5xl font-bold mb-8">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  About Me
                </span>
              </h2>
              <p className="text-xl text-white/60 mb-6 leading-relaxed">
                Master's student in Applied Computing with AI Specialization at the University of Windsor. 
                Passionate about building innovative solutions that merge cutting-edge technology with 
                exceptional user experiences.
              </p>
              <p className="text-xl text-white/60 mb-8 leading-relaxed">
                With expertise in full-stack development, machine learning, and distributed systems, 
                I create software that pushes boundaries and solves real-world problems.
              </p>
              <div className="flex gap-4 flex-wrap">
                <a href="https://github.com/Arshnoor-Singh-Sohi" target="_blank" rel="noopener noreferrer"
                   className="text-white/60 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </a>
                <a href="https://www.linkedin.com/in/arshnoorsinghsohi/" target="_blank" rel="noopener noreferrer"
                   className="text-white/60 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="https://arshnoorsinghsohi.medium.com/" target="_blank" rel="noopener noreferrer"
                   className="text-white/60 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div className="relative">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-3xl opacity-20"
              />
              <div className="relative bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-8 border border-white/10">
                <h3 className="text-2xl font-bold mb-6">Tech Stack</h3>
                <div className="grid grid-cols-3 gap-4">
                  {['React', 'Python', 'Java', 'TypeScript', 'Node.js', 'TensorFlow', 'AWS', 'Docker', 'GraphQL'].map((tech) => (
                    <motion.div
                      key={tech}
                      whileHover={{ scale: 1.1 }}
                      className="bg-white/5 backdrop-blur-xl rounded-lg p-3 text-center border border-white/10"
                    >
                      <span className="text-sm">{tech}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects Preview Section */}
      <section id="projects" className="py-32 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-16"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Featured Projects
            </span>
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition duration-500" />
            <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl p-12 border border-white/10">
              <p className="text-xl text-white/60 mb-8">
                Explore my collection of 20+ projects showcasing expertise in AI, web development, 
                distributed systems, and more.
              </p>
              <MagneticButton
                className="px-12 py-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-medium text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
                onClick={handleSeeMyProjectsClick}
              >
                View All Projects →
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-32 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-16 text-center"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Latest Articles
            </span>
          </motion.h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {articles.map((article, index) => (
              <motion.article
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
                onClick={() => window.open('https://arshnoorsinghsohi.medium.com/', '_blank')}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition duration-500" />
                  <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl p-8 border border-white/10 h-full">
                    <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
                      <span>{article.date}</span>
                      <span>•</span>
                      <span>{article.readTime}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-4 group-hover:text-purple-400 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-white/60 mb-6">{article.excerpt}</p>
                    <div className="flex items-center text-purple-400 font-medium">
                      <span>Read More</span>
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mt-12"
          >
            <MagneticButton
              className="px-8 py-4 bg-white/10 backdrop-blur-xl rounded-full font-medium border border-white/20 hover:bg-white/20 transition-all duration-300"
              onClick={() => window.open('https://arshnoorsinghsohi.medium.com/', '_blank')}
            >
              View All Articles on Medium →
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* Certifications Section */}
      <section id="certifications" className="py-32 px-8">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-16 text-center"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Certifications & Achievements
            </span>
          </motion.h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <CertificationCard key={index} cert={cert} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-8"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Let's Connect
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/60 mb-12"
          >
            Ready to collaborate on something amazing? I'm always open to discussing new opportunities,
            creative ideas, and exciting projects.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-6 justify-center"
          >
            <MagneticButton
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-medium hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
              onClick={() => window.location.href = 'mailto:sohi21@uwindsor.ca'}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                sohi21@uwindsor.ca
              </span>
            </MagneticButton>
            
            <MagneticButton
              className="px-8 py-4 bg-white/10 backdrop-blur-xl rounded-full font-medium border border-white/20 hover:bg-white/20 transition-all duration-300"
              onClick={() => window.open('https://linktr.ee/arshnoorsinghsohi', '_blank')}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                All Links
              </span>
            </MagneticButton>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AwwardsPortfolio;
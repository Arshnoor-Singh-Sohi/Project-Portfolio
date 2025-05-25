import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import SimplePortfolio from './SimplePortfolio';

// IconCloud Component - Pure JavaScript version
// Icon object structure: { x, y, z, scale, opacity, id }
// IconCloudProps: { icons?: ReactNode[], images?: string[] }

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function IconCloud({ icons, images }) {
  const canvasRef = useRef(null);
  const [iconPositions, setIconPositions] = useState([]);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetRotation, setTargetRotation] = useState(null);
  const animationFrameRef = useRef();
  const rotationRef = useRef(rotation);
  const iconCanvasesRef = useRef([]);
  const imagesLoadedRef = useRef([]);

  // Create icon canvases once when icons/images change
  useEffect(() => {
    if (!icons && !images) return;

    const items = icons || images || [];
    imagesLoadedRef.current = new Array(items.length).fill(false);

    const newIconCanvases = items.map((item, index) => {
      const offscreen = document.createElement("canvas");
      offscreen.width = 40;
      offscreen.height = 40;
      const offCtx = offscreen.getContext("2d");

      if (offCtx) {
        if (images) {
          // Handle image URLs directly
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = items[index];
          img.onload = () => {
            offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
            offCtx.beginPath();
            offCtx.arc(20, 20, 20, 0, Math.PI * 2);
            offCtx.closePath();
            offCtx.clip();
            offCtx.drawImage(img, 0, 0, 40, 40);
            imagesLoadedRef.current[index] = true;
          };
        }
      }
      return offscreen;
    });

    iconCanvasesRef.current = newIconCanvases;
  }, [icons, images]);

  // Generate initial icon positions on a sphere
  useEffect(() => {
    const items = icons || images || [];
    const newIcons = [];
    const numIcons = items.length || 20;

    const offset = 2 / numIcons;
    const increment = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < numIcons; i++) {
      const y = i * offset - 1 + offset / 2;
      const r = Math.sqrt(1 - y * y);
      const phi = i * increment;

      const x = Math.cos(phi) * r;
      const z = Math.sin(phi) * r;

      newIcons.push({
        x: x * 100,
        y: y * 100,
        z: z * 100,
        scale: 1,
        opacity: 1,
        id: i,
      });
    }
    setIconPositions(newIcons);
  }, [icons, images]);

  // Handle mouse events
  const handleMouseDown = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !canvasRef.current) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
    }

    if (isDragging) {
      const deltaX = e.clientX - lastMousePos.x;
      const deltaY = e.clientY - lastMousePos.y;

      rotationRef.current = {
        x: rotationRef.current.x + deltaY * 0.002,
        y: rotationRef.current.y + deltaX * 0.002,
      };

      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Animation and rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      const dx = mousePos.x - centerX;
      const dy = mousePos.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = 0.003 + (distance / maxDistance) * 0.01;

      if (targetRotation) {
        const elapsed = performance.now() - targetRotation.startTime;
        const progress = Math.min(1, elapsed / targetRotation.duration);
        const easedProgress = easeOutCubic(progress);

        rotationRef.current = {
          x: targetRotation.startX + (targetRotation.x - targetRotation.startX) * easedProgress,
          y: targetRotation.startY + (targetRotation.y - targetRotation.startY) * easedProgress,
        };

        if (progress >= 1) {
          setTargetRotation(null);
        }
      } else if (!isDragging) {
        rotationRef.current = {
          x: rotationRef.current.x + (dy / canvas.height) * speed,
          y: rotationRef.current.y + (dx / canvas.width) * speed,
        };
      }

      iconPositions.forEach((icon, index) => {
        const cosX = Math.cos(rotationRef.current.x);
        const sinX = Math.sin(rotationRef.current.x);
        const cosY = Math.cos(rotationRef.current.y);
        const sinY = Math.sin(rotationRef.current.y);

        const rotatedX = icon.x * cosY - icon.z * sinY;
        const rotatedZ = icon.x * sinY + icon.z * cosY;
        const rotatedY = icon.y * cosX + rotatedZ * sinX;

        const scale = (rotatedZ + 200) / 300;
        const opacity = Math.max(0.2, Math.min(1, (rotatedZ + 150) / 200));

        ctx.save();
        ctx.translate(canvas.width / 2 + rotatedX, canvas.height / 2 + rotatedY);
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;

        if (images && iconCanvasesRef.current[index] && imagesLoadedRef.current[index]) {
          ctx.drawImage(iconCanvasesRef.current[index], -20, -20, 40, 40);
        } else {
          // Fallback circles with tech names
          const techNames = ['React', 'Python', 'Java', 'TS', 'Node', 'TF', 'AWS', 'Docker', 'GQL'];
          ctx.beginPath();
          ctx.arc(0, 0, 20, 0, Math.PI * 2);
          ctx.fillStyle = "#8352FD";
          ctx.fill();
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.font = "10px Arial";
          ctx.fillText(techNames[icon.id] || `${icon.id + 1}`, 0, 0);
        }

        ctx.restore();
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [icons, images, iconPositions, isDragging, mousePos, targetRotation]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="rounded-lg w-full max-w-sm mx-auto"
      style={{ touchAction: 'none' }}
      aria-label="Interactive 3D Tech Stack Cloud"
      role="img"
    />
  );
}

// 3D Animated Sphere Component - Made responsive
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

// Magnetic Button Component - Enhanced for mobile
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

// Mobile-friendly Navigation Component
const FloatingNav = ({ activeSection }) => {
  const navItems = ['Home', 'About', 'Projects', 'Blog', 'Certifications', 'Contact'];
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 justify-center pt-4 px-4 hidden md:flex"
      >
        <motion.div
          className="bg-black/10 backdrop-blur-xl rounded-full px-6 py-3 border border-white/10"
          whileHover={{ scale: 1.02 }}
        >
          <ul className="flex gap-6">
            {navItems.map((item) => (
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

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <motion.button
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-4 right-4 z-50 bg-black/20 backdrop-blur-xl rounded-full p-3 border border-white/10"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </motion.button>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-16 right-4 z-40 bg-black/90 backdrop-blur-xl rounded-2xl p-4 border border-white/10"
          >
            <ul className="space-y-3">
              {navItems.map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className={`block text-base font-medium transition-colors py-2 px-3 rounded-lg ${
                      activeSection === item.toLowerCase() ? 'text-white bg-white/10' : 'text-white/60'
                    } hover:text-white hover:bg-white/5`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </>
  );
};

// Certification Card Component - Made responsive
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
      <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10">
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-semibold text-sm sm:text-base truncate">{cert.name}</h3>
            <p className="text-white/60 text-xs sm:text-sm truncate">{cert.issuer}</p>
          </div>
        </div>
        <p className="text-white/80 text-xs sm:text-sm">{cert.date}</p>
      </div>
    </motion.div>
  );
};

// Main Portfolio Component - Fully Responsive
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

  // Custom Cursor (desktop only)
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    // Only add cursor on desktop
    if (window.innerWidth >= 768) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Effect to handle browser back/forward and initial load based on URL hash
  useEffect(() => {
    const handlePopState = () => {
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
      window.history.replaceState({ view: 'mainPortfolio' }, 'Main Portfolio', window.location.pathname + window.location.search);
    }

    // Listen for popstate events (browser back/forward button clicks)
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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

  // Tech stack images for IconCloud - Comprehensive skill representation from resumes
  const techImages = [
    // Core Programming Languages
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dart/dart-original.svg',
    
    // Web Technologies
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg',
    
    // Databases
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/oracle/oracle-original.svg',
    
    // AI/ML & Data Science
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/numpy/numpy-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opencv/opencv-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original.svg',
    
    // Frameworks & Tools
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spring/spring-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apache/apache-original.svg',
    
    // Cloud & DevOps
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
    
    // Systems & OS
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg'
  ];

  // Handler to show SimplePortfolio
  const handleSeeMyProjectsClick = () => {
    setShowSimplePortfolio(true);
    window.history.pushState({ view: 'simplePortfolio' }, 'Projects', '#projects');
  };

  // Handler to go back to the main portfolio
  const handleBackToMainPortfolio = () => {
    setShowSimplePortfolio(false);
    window.history.back();
  };

  // Conditional rendering
  if (showSimplePortfolio) {
    return <SimplePortfolio onBack={handleBackToMainPortfolio} />;
  }

  return (
    <div className="bg-black text-white overflow-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Custom Cursor - Desktop Only */}
      {window.innerWidth >= 768 && (
        <motion.div
          ref={cursorRef}
          className="fixed w-6 h-6 bg-white rounded-full pointer-events-none z-50 mix-blend-difference hidden md:block"
          animate={{ x: mousePosition.x - 12, y: mousePosition.y - 12 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
        />
      )}

      {/* Navigation */}
      <FloatingNav activeSection={activeSection} />

      {/* Hero Section - Fully Responsive */}
      <section id="home" className="relative min-h-screen flex items-center justify-center px-4">
        {/* 3D Background - Hidden on small screens for performance */}
        <div className="absolute inset-0 z-0 hidden sm:block">
          <Canvas camera={{ position: [0, 0, 5] }}>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <AnimatedSphere />
            <OrbitControls enableZoom={false} enablePan={false} />
          </Canvas>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-4"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              ʌɾƨɦɲооɾ
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white/60 font-light mb-8 px-4"
          >
            Software Engineer • AI Enthusiast • Creative Developer
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center px-4"
          >
            <MagneticButton
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-medium hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 text-sm sm:text-base"
              onClick={handleSeeMyProjectsClick}
            >
              See My Projects
            </MagneticButton>
            <MagneticButton
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-xl rounded-full font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 text-sm sm:text-base"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get In Touch
            </MagneticButton>
          </motion.div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-4 sm:bottom-10 left-1/2 transform -translate-x-1/2"
        >
          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </motion.div>
      </section>

      {/* About Section - Responsive Grid and IconCloud */}
      <section id="about" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center"
          >
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
                  About Me
                </span>
              </h2>
              <p className="text-base sm:text-lg lg:text-xl text-white/60 mb-4 sm:mb-6 leading-relaxed">
                Master's student in Applied Computing with AI Specialization at the University of Windsor. 
                Passionate about building innovative solutions that merge cutting-edge technology with 
                exceptional user experiences.
              </p>
              <p className="text-base sm:text-lg lg:text-xl text-white/60 mb-6 sm:mb-8 leading-relaxed">
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
            
            {/* IconCloud Section - Order 1 on mobile, 2 on desktop */}
            <div className="relative order-1 lg:order-2 flex justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur-3xl opacity-20"
              />
              <div className="relative bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 w-full max-w-md">
                <h3 className="text-xl sm:text-2xl font-bold mb-6 text-center">Tech Stack</h3>
                <div className="flex justify-center">
                  <IconCloud images={techImages} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects Preview Section - Responsive */}
      <section id="projects" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 sm:mb-16"
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
            <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 lg:p-12 border border-white/10">
              <p className="text-base sm:text-lg lg:text-xl text-white/60 mb-6 sm:mb-8">
                Explore my collection of 20+ projects showcasing expertise in AI, web development, 
                distributed systems, and more.
              </p>
              <MagneticButton
                className="px-8 sm:px-12 py-4 sm:py-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-medium text-base sm:text-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300"
                onClick={handleSeeMyProjectsClick}
              >
                View All Projects →
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Blog Section - Responsive Cards */}
      <section id="blog" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 sm:mb-16 text-center"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Latest Articles
            </span>
          </motion.h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
                  <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-white/10 h-full">
                    <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
                      <span>{article.date}</span>
                      <span>•</span>
                      <span>{article.readTime}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-4 group-hover:text-purple-400 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-white/60 mb-6 text-sm sm:text-base">{article.excerpt}</p>
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
            className="text-center mt-8 sm:mt-12"
          >
            <MagneticButton
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-xl rounded-full font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 text-sm sm:text-base"
              onClick={() => window.open('https://arshnoorsinghsohi.medium.com/', '_blank')}
            >
              View All Articles on Medium →
            </MagneticButton>
          </motion.div>
        </div>
      </section>

      {/* Certifications Section - Responsive Grid */}
      <section id="certifications" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 sm:mb-16 text-center"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Certifications & Achievements
            </span>
          </motion.h2>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {certifications.map((cert, index) => (
              <CertificationCard key={index} cert={cert} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section - Responsive */}
      <section id="contact" className="py-16 sm:py-24 lg:py-32 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 sm:mb-8"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              Let's Connect
            </span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg lg:text-xl text-white/60 mb-8 sm:mb-12"
          >
            Ready to collaborate on something amazing? I'm always open to discussing new opportunities,
            creative ideas, and exciting projects.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center"
          >
            <MagneticButton
              className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-medium hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 text-sm sm:text-base"
              onClick={() => window.location.href = 'mailto:sohi21@uwindsor.ca'}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">sohi21@uwindsor.ca</span>
                <span className="sm:hidden">Email Me</span>
              </span>
            </MagneticButton>
            
            <MagneticButton
              className="px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-xl rounded-full font-medium border border-white/20 hover:bg-white/20 transition-all duration-300 text-sm sm:text-base"
              onClick={() => window.open('https://linktr.ee/arshnoorsinghsohi', '_blank')}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
// src/components/HeroSection.jsx
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

const HeroSection = () => {
    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const descriptionRef = useRef(null);
    const heroRef = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline();

        // Split the title text into spans for character-by-character animation
        const title = titleRef.current;
        const subtitle = subtitleRef.current;

        // Create spans for each character
        const splitTitle = new SplitText(title, { type: "chars, words" });
        const splitSubtitle = new SplitText(subtitle, { type: "chars, words" });

        // Create a 3D perspective on the hero container
        gsap.set(heroRef.current, { perspective: 1000 });

        // Title Animation
        tl.from(splitTitle.chars, {
            duration: 0.8,
            opacity: 0,
            scale: 0,
            y: 80,
            rotationX: 180,
            transformOrigin: "0% 50% -50",
            ease: "back.out(1.7)",
            stagger: 0.05
        })

            // Subtitle Animation
            .from(splitSubtitle.chars, {
                duration: 0.5,
                scale: 0,
                y: -40,
                opacity: 0,
                rotation: 90,
                ease: "power4.out",
                stagger: 0.03
            }, "-=0.4")

            // Description Animation
            .from(descriptionRef.current, {
                duration: 0.7,
                opacity: 0,
                y: 20,
                ease: "power2.out"
            }, "-=0.2")

        // Create scroll-triggered animation for parallax effect
        gsap.to(heroRef.current, {
            scrollTrigger: {
                trigger: heroRef.current,
                start: "top top",
                end: "bottom top",
                scrub: true
            },
            y: (i, target) => -ScrollTrigger.maxScroll(window) * 0.15,
            ease: "none"
        });

        // Mouse movement effect for 3D rotation
        const handleMouseMove = (e) => {
            const { clientX, clientY } = e;
            const xPos = (clientX / window.innerWidth - 0.5) * 30;
            const yPos = (clientY / window.innerHeight - 0.5) * 30;

            gsap.to(titleRef.current, {
                rotationY: xPos * 0.2,
                rotationX: -yPos * 0.2,
                duration: 1,
                ease: "power3.out"
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            ScrollTrigger.getAll().forEach(st => st.kill());
        };
    }, []);

    return (
        <section
            ref={heroRef}
            className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Background Elements */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 opacity-80"></div>

                {/* Abstract shapes */}
                <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-gradient-to-r from-pink-200 to-indigo-200 dark:from-pink-900 dark:to-indigo-900 blur-3xl opacity-20"></div>
                <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-900 dark:to-cyan-900 blur-3xl opacity-20"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center mb-10">
                <h1
                    ref={titleRef}
                    className="text-5xl md:text-7xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-300 dark:to-blue-400"
                >
                    My Projects
                </h1>

                <h2
                    ref={subtitleRef}
                    className="text-xl md:text-2xl font-medium mb-6 text-gray-700 dark:text-gray-300"
                >
                    Created By Arshnoor Singh Sohi
                </h2>

                <p
                    ref={descriptionRef}
                    className="max-w-2xl mx-auto text-gray-600 dark:text-gray-400 leading-relaxed"
                >
                    Explore my collection of projects showcasing skills in web development,
                    data science, machine learning, and more. Each project represents my
                    passion for building innovative solutions using cutting-edge technologies.
                </p>
            </div>

            {/* Scroll indicator animation */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Scroll to explore</p>
                <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center p-1">
                    <div className="scroll-dot w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full animate-scrollDown"></div>
                </div>
            </div>
        </section>
    );
};

// Helper component for text splitting (simplified version of SplitText)
const SplitText = (element, config) => {
    const text = element.textContent;
    element.innerHTML = '';

    const words = [];
    const chars = [];

    text.split(' ').forEach(word => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        wordSpan.style.display = 'inline-block';

        word.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.className = 'char';
            charSpan.style.display = 'inline-block';
            charSpan.textContent = char;
            chars.push(charSpan);
            wordSpan.appendChild(charSpan);
        });

        words.push(wordSpan);
        element.appendChild(wordSpan);

        // Add space after word
        const space = document.createTextNode(' ');
        element.appendChild(space);
    });

    return { chars, words };
};

export default HeroSection;
// src/utils/gsapSetup.js
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { SplitText } from 'gsap/SplitText';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin, SplitText);

// Helper for text animations
export const animateText = (element, options = {}) => {
    const defaults = {
        duration: 0.8,
        stagger: 0.05,
        ease: "power3.out",
        y: 40,
        opacity: 0,
        splitType: "chars,words",
    };

    const settings = { ...defaults, ...options };

    // Create SplitText instance
    const splitText = new SplitText(element, { type: settings.splitType });

    // Animate chars
    return gsap.from(splitText.chars, {
        duration: settings.duration,
        y: settings.y,
        opacity: settings.opacity,
        stagger: settings.stagger,
        ease: settings.ease,
        onComplete: () => {
            // Optional cleanup if needed
            if (settings.revert) {
                splitText.revert();
            }
        }
    });
};

// Helper for scroll-triggered animations
export const createScrollTrigger = (trigger, animation, options = {}) => {
    const defaults = {
        trigger,
        start: "top 80%",
        end: "bottom 20%",
        toggleActions: "play none none none"
    };

    const settings = { ...defaults, ...options };

    return ScrollTrigger.create({
        ...settings,
        animation
    });
};

// Parallax effect helper
export const createParallax = (element, options = {}) => {
    const defaults = {
        yPercent: -20,
        ease: "none",
        scrollTrigger: {
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            scrub: 1
        }
    };

    const settings = { ...defaults, ...options };

    return gsap.to(element, settings);
};

export default gsap;
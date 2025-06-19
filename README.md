# Arshnoor's Portfolio Showcase

A modern, interactive portfolio website built with React, featuring stunning 3D animations, multiple layout options, and a comprehensive project showcase. This portfolio demonstrates advanced web development techniques while maintaining excellent user experience across all devices.

## ✨ Key Features

This portfolio represents a sophisticated approach to personal branding through web technology. The project showcases not just the portfolio content, but also serves as a demonstration of modern web development capabilities.

### Interactive 3D Elements
The portfolio incorporates Three.js and React Three Fiber to create immersive 3D experiences. Floating geometric shapes, animated spheres with distortion materials, and particle systems create a dynamic visual environment that responds to user interactions. These elements aren't just decorative—they demonstrate proficiency with complex 3D rendering in web browsers.

### Multiple Portfolio Layouts
Rather than settling for a single design approach, this project offers multiple distinct portfolio experiences:

- **AwwardsPortfolio**: A premium, award-winning design inspired by modern agency websites
- **SimplePortfolio**: A clean, professional layout focused on content accessibility
- **HomePage**: A traditional approach with enhanced interactivity

Each layout serves different purposes and audiences, showcasing versatility in design thinking and implementation.

### Advanced Animation Systems
The project utilizes multiple animation libraries working in harmony:

- **Framer Motion** handles React component animations and page transitions
- **GSAP** powers complex timeline animations and scroll-triggered effects
- **Custom CSS animations** provide micro-interactions and hover effects

This multi-layered approach demonstrates understanding of when to use different animation tools for optimal performance and visual impact.

### Intelligent Project Filtering
The project showcase includes sophisticated filtering mechanisms that enhance user experience:

- **Real-time search** with intelligent suggestions
- **Technology-based filtering** allowing users to explore projects by tech stack
- **Alphabetical categorization** for quick navigation
- **Multi-filter combinations** enabling precise project discovery

### Responsive Design Excellence
Every component is built with mobile-first principles, ensuring the complex 3D elements and animations gracefully adapt to different screen sizes and performance capabilities.

## 🛠️ Technology Stack

### Core Framework
- **React 19.1.0** - Latest React with concurrent features
- **Vite 6.3.5** - Lightning-fast build tool with hot reload
- **JavaScript (ES6+)** - Modern syntax and features

### Styling and UI
- **Tailwind CSS 3.3.3** - Utility-first CSS framework
- **Custom CSS** - Advanced animations and 3D transformations
- **Responsive Design** - Mobile-first approach

### Animation Libraries
- **Framer Motion 12.12.1** - React animation library for component transitions
- **GSAP 3.13.0** - Professional-grade animation toolkit
- **React Spring** - Spring-physics based animations

### 3D Graphics
- **Three.js (r176)** - 3D graphics library
- **React Three Fiber 9.1.2** - React renderer for Three.js
- **React Three Drei 10.0.8** - Useful helpers for React Three Fiber

### Interactive Elements
- **React TSParticles 2.12.2** - Particle system effects
- **Custom 3D Components** - Floating elements and interactive shapes

### Development Tools
- **ESLint** - Code quality and consistency
- **PostCSS & Autoprefixer** - CSS processing
- **Modern Build Pipeline** - Optimized for production

## 🚀 Installation and Setup

### Prerequisites
Before starting, ensure you have Node.js (version 16 or higher) installed on your system. This project uses modern JavaScript features that require a recent Node.js version.

### Step-by-Step Installation

First, clone the repository to your local machine:

```bash
git clone https://github.com/Arshnoor-Singh-Sohi/my-portfolio.git
cd my-portfolio
```

Install all project dependencies using npm:

```bash
npm install
```

This command will install all the packages listed in `package.json`, including React, Three.js, Framer Motion, and other essential libraries.

### Development Server

Start the development server to begin working on the project:

```bash
npm run dev
```

The development server will start on `http://localhost:5173` (Vite's default port). The page will automatically reload when you make changes to the source code.

### Building for Production

When you're ready to deploy, create an optimized production build:

```bash
npm run build
```

This generates a `dist` folder containing all the optimized files ready for deployment to any static hosting service.

### Preview Production Build

Test the production build locally before deployment:

```bash
npm run preview
```

## 📁 Project Structure

Understanding the project structure helps in navigation and customization:

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (3D card, etc.)
│   ├── BackgroundMusic.jsx    # Music player component
│   ├── BubbleBackground.jsx   # Animated bubble effects
│   ├── FloatingElements.jsx   # 3D floating shapes
│   ├── Header.jsx            # Navigation header
│   ├── HeroSection.jsx       # Landing section
│   ├── ProjectCard.jsx       # Individual project display
│   └── WavesBackground.jsx   # 3D wave animations
├── data/
│   └── projects.js          # Project information database
├── pages/
│   ├── AwwardsPortfolio.jsx # Premium portfolio layout
│   ├── SimplePortfolio.jsx  # Clean portfolio layout
│   └── HomePage.jsx         # Traditional layout
├── styles/              # Custom CSS and styling
└── utils/              # Helper functions and utilities
```

### Key Component Explanations

**ProjectCard.jsx** serves as the foundation for displaying individual projects. It uses the 3D card system to create engaging hover effects while maintaining accessibility and performance.

**AwwardsPortfolio.jsx** represents the flagship portfolio experience, incorporating multiple 3D elements, particle systems, and advanced animations to create a premium feel.

**projects.js** contains all project data in a structured format, making it easy to add new projects or modify existing ones without touching component code.

## 🎨 Customization Guide

### Adding New Projects

Projects are managed through the `src/data/projects.js` file. Each project follows this structure:

```javascript
{
    id: 1,
    name: "Project Name",
    description: "Detailed project description",
    techs: ["React", "Node.js", "MongoDB"],
    repoUrl: "https://github.com/username/repo",
    image: "/path/to/project/image.png",
    isLive: true,
    liveUrl: "https://project-demo.com",
    featured: true
}
```

The `featured` property determines whether a project appears in the special featured section, while `isLive` controls the display of live demo buttons.

### Customizing Colors and Themes

The project uses CSS custom properties for consistent theming. Modify the root variables in your CSS files:

```css
:root {
    --primary-color: #4361ee;
    --secondary-color: #4cc9f0;
    --accent-color: #8b5cf6;
}
```

Tailwind CSS classes can be customized in `tailwind.config.cjs` to match your brand colors and design preferences.

### Modifying 3D Elements

3D components are located in the `components` directory. Each uses React Three Fiber, making them highly customizable. For example, to modify the floating sphere:

```javascript
// In AnimatedSphere component
<Sphere args={[1, 100, 200]} scale={2.5}>
    <MeshDistortMaterial
        color="#your-color"
        distort={0.3}
        speed={1.5}
    />
</Sphere>
```

### Adding New Sections

Create new sections by following the existing component patterns. Use Framer Motion for animations and ensure responsive design:

```javascript
const NewSection = () => {
    return (
        <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
        >
            {/* Your content */}
        </motion.section>
    );
};
```

## 🌐 Deployment

### Recommended Hosting Platforms

This static site works excellently with modern hosting platforms:

**Vercel** (Recommended for React projects):
```bash
npm install -g vercel
vercel
```

**Netlify**:
Connect your GitHub repository and enable automatic deployments.

**GitHub Pages**:
Use the built-in Actions workflow for automatic deployment.

### Build Optimization

The project includes several optimization features:

- **Code splitting** through Vite's built-in features
- **Asset optimization** including image compression
- **Tree shaking** to eliminate unused code
- **Modern JavaScript** with fallbacks for older browsers

### Environment Variables

For deployment, you may need to configure environment variables for any external services. Create a `.env` file in the root directory:

```env
VITE_API_URL=your-api-url
VITE_ANALYTICS_ID=your-analytics-id
```

## 🔧 Performance Considerations

### 3D Element Optimization

The 3D elements are designed with performance in mind:

- **Frame rate limiting** prevents excessive CPU usage
- **Conditional rendering** based on device capabilities
- **LOD (Level of Detail)** for complex geometries
- **Proper cleanup** of Three.js resources

### Animation Performance

Animations use hardware acceleration where possible:

- **Transform and opacity** animations for smooth performance
- **RequestAnimationFrame** for optimal timing
- **Intersection Observer** for scroll-triggered animations
- **Reduced motion support** for accessibility

### Bundle Size Management

The build process optimizes for minimal bundle sizes:

- **Dynamic imports** for route-based code splitting
- **Tree shaking** eliminates unused library code
- **Asset optimization** compresses images and fonts
- **Modern format support** serves WebP images where supported

## 🤝 Contributing

If you'd like to contribute to this project or use it as a foundation for your own portfolio:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License. Feel free to use it as inspiration or foundation for your own portfolio projects.

## 🎯 Future Enhancements

Planned improvements include:

- **CMS Integration** for easier content management
- **Blog Section** with markdown support
- **Contact Form** with backend integration
- **Analytics Dashboard** for visitor insights
- **Progressive Web App** features

---

**Built with ❤️ by Arshnoor Singh Sohi**

For questions or collaboration opportunities, reach out at [sohi21@uwindsor.ca](mailto:sohi21@uwindsor.ca)

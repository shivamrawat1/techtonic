/**
 * Techtonic Landing Page - Modern JavaScript
 * Enhanced with ES6+, performance optimizations, and modern UX patterns
 */

class TechtonicLanding {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.setupPageLoader();
        this.setupScrollProgress();
        this.setupNavigation();
        this.setupScrollAnimations();
        this.setupTestimonials();
        this.setupPricingToggle();
        this.setupContactForm();
        this.setupBackToTop();
        this.setupParallaxEffects();
        this.setupIntersectionObserver();
        this.setupSmoothScrolling();
        this.setupPerformanceOptimizations();

        console.log('🚀 Techtonic Landing Page initialized successfully!');
    }

    // Page Loader
    setupPageLoader() {
        const loader = document.getElementById('pageLoader');
        if (!loader) return;

        // Simulate loading time
        const minLoadTime = 1000;
        const startTime = Date.now();

        window.addEventListener('load', () => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadTime - elapsedTime);

            setTimeout(() => {
                loader.style.opacity = '0';
                setTimeout(() => {
                    loader.style.display = 'none';
                }, 500);
            }, remainingTime);
        });
    }

    // Scroll Progress Bar
    setupScrollProgress() {
        const progressBar = document.getElementById('scrollProgress');
        if (!progressBar) return;

        const updateProgress = this.debounce(() => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            progressBar.style.width = `${scrollPercent}%`;
        }, 10);

        window.addEventListener('scroll', updateProgress);
    }

    // Navigation
    setupNavigation() {
        const navbar = document.getElementById('navbar');
        const navToggle = document.getElementById('navToggle');
        const navMenu = document.getElementById('navMenu');
        const navLinks = document.querySelectorAll('.nav-link');

        if (!navbar || !navToggle || !navMenu) return;

        // Navbar scroll effect
        let lastScrollY = window.scrollY;
        const handleScroll = this.debounce(() => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Hide/show navbar on scroll
            if (currentScrollY > lastScrollY && currentScrollY > 200) {
                navbar.classList.add('navbar-hidden');
            } else {
                navbar.classList.remove('navbar-hidden');
            }

            lastScrollY = currentScrollY;
        }, 10);

        window.addEventListener('scroll', handleScroll);

        // Mobile menu toggle
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        // Close mobile menu when clicking on links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });

        // Active navigation highlighting
        this.setupActiveNavigation(navLinks);
    }

    setupActiveNavigation(navLinks) {
        const sections = document.querySelectorAll('section[id]');

        const updateActiveNav = this.debounce(() => {
            const scrollPos = window.scrollY + 100;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, 100);

        window.addEventListener('scroll', updateActiveNav);
    }

    // Scroll Animations
    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('[data-aos], .animate-fade-in-up, .animate-fade-in-right, .animate-fade-in-left');

        animatedElements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = this.getInitialTransform(element);
            element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            element.style.transitionDelay = `${index * 0.1}s`;
        });
    }

    getInitialTransform(element) {
        if (element.classList.contains('animate-fade-in-up')) {
            return 'translateY(30px)';
        } else if (element.classList.contains('animate-fade-in-right')) {
            return 'translateX(30px)';
        } else if (element.classList.contains('animate-fade-in-left')) {
            return 'translateX(-30px)';
        }
        return 'translateY(30px)';
    }

    // Testimonials Slider
    setupTestimonials() {
        const slider = document.getElementById('testimonialsSlider');
        const prevBtn = document.getElementById('prevTestimonial');
        const nextBtn = document.getElementById('nextTestimonial');
        const dots = document.querySelectorAll('.testimonial-dots .dot');
        const cards = document.querySelectorAll('.testimonial-card');

        if (!slider || !cards.length) return;

        let currentSlide = 0;
        let autoSlideInterval;

        const showSlide = (index) => {
            cards.forEach((card, i) => {
                card.classList.toggle('active', i === index);
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });

            currentSlide = index;
        };

        const nextSlide = () => {
            const next = (currentSlide + 1) % cards.length;
            showSlide(next);
        };

        const prevSlide = () => {
            const prev = (currentSlide - 1 + cards.length) % cards.length;
            showSlide(prev);
        };

        const startAutoSlide = () => {
            autoSlideInterval = setInterval(nextSlide, 5000);
        };

        const stopAutoSlide = () => {
            clearInterval(autoSlideInterval);
        };

        // Event listeners
        if (nextBtn) nextBtn.addEventListener('click', () => {
            nextSlide();
            stopAutoSlide();
            startAutoSlide();
        });

        if (prevBtn) prevBtn.addEventListener('click', () => {
            prevSlide();
            stopAutoSlide();
            startAutoSlide();
        });

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
                stopAutoSlide();
                startAutoSlide();
            });
        });

        // Pause on hover
        const container = slider.closest('.testimonials-container');
        if (container) {
            container.addEventListener('mouseenter', stopAutoSlide);
            container.addEventListener('mouseleave', startAutoSlide);
        }

        // Initialize
        showSlide(0);
        startAutoSlide();

        // Touch/swipe support
        this.setupTouchSwipe(slider, nextSlide, prevSlide);
    }

    setupTouchSwipe(element, nextCallback, prevCallback) {
        let startX = 0;
        let endX = 0;

        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        element.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diff = startX - endX;

            if (Math.abs(diff) > 50) { // Minimum swipe distance
                if (diff > 0) {
                    nextCallback();
                } else {
                    prevCallback();
                }
            }
        });
    }

    // Pricing Toggle
    setupPricingToggle() {
        const toggle = document.getElementById('pricing-toggle');
        const monthlyPrices = document.querySelectorAll('.monthly-price');
        const yearlyPrices = document.querySelectorAll('.yearly-price');

        if (!toggle) return;

        toggle.addEventListener('change', () => {
            const isYearly = toggle.checked;

            monthlyPrices.forEach(price => {
                price.style.display = isYearly ? 'none' : 'inline';
            });

            yearlyPrices.forEach(price => {
                price.style.display = isYearly ? 'inline' : 'none';
            });

            // Animate price change
            document.querySelectorAll('.plan-price').forEach(priceEl => {
                priceEl.classList.add('price-changing');
                setTimeout(() => {
                    priceEl.classList.remove('price-changing');
                }, 300);
            });
        });
    }

    // Contact Form
    setupContactForm() {
        const form = document.getElementById('contactForm');
        if (!form) return;

        const inputs = form.querySelectorAll('input, select, textarea');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Real-time validation
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (this.validateForm(form)) {
                await this.submitForm(form, submitBtn);
            }
        });

        // Auto-resize textarea
        const textarea = form.querySelector('textarea');
        if (textarea) {
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        }
    }

    validateField(field) {
        const value = field.value.trim();
        const fieldType = field.type;
        const fieldName = field.name;
        const errorElement = document.getElementById(`${fieldName}Error`);

        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (fieldType === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }

        // Name validation
        if ((fieldName === 'firstName' || fieldName === 'lastName') && value && value.length < 2) {
            isValid = false;
            errorMessage = 'Name must be at least 2 characters';
        }

        // Message validation
        if (fieldName === 'message' && value && value.length < 10) {
            isValid = false;
            errorMessage = 'Message must be at least 10 characters';
        }

        this.showFieldError(field, errorElement, errorMessage);
        return isValid;
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    showFieldError(field, errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = message ? 'block' : 'none';
        }
        field.classList.toggle('error', !!message);
    }

    clearFieldError(field) {
        const fieldName = field.name;
        const errorElement = document.getElementById(`${fieldName}Error`);
        this.showFieldError(field, errorElement, '');
    }

    async submitForm(form, submitBtn) {
        const originalText = submitBtn.innerHTML;
        const formData = new FormData(form);

        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Show success message
            this.showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
            form.reset();

            // Reset textarea height
            const textarea = form.querySelector('textarea');
            if (textarea) textarea.style.height = 'auto';

        } catch (error) {
            this.showNotification('Failed to send message. Please try again.', 'error');
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Back to Top Button
    setupBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (!backToTopBtn) return;

        const toggleBackToTop = this.debounce(() => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        }, 100);

        window.addEventListener('scroll', toggleBackToTop);

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Parallax Effects
    setupParallaxEffects() {
        const parallaxElements = document.querySelectorAll('.hero-shapes .shape');

        const handleParallax = this.debounce(() => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;

            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                element.style.transform = `translateY(${rate * speed}px)`;
            });
        }, 10);

        window.addEventListener('scroll', handleParallax);
    }

    // Intersection Observer for animations
    setupIntersectionObserver() {
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe animated elements
        document.querySelectorAll('[data-aos], .animate-fade-in-up, .animate-fade-in-right, .animate-fade-in-left').forEach(el => {
            observer.observe(el);
        });
    }

    // Smooth Scrolling
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                const href = anchor.getAttribute('href');
                if (href === '#' || href === '#!') return;

                e.preventDefault();
                const target = document.querySelector(href);

                if (target) {
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // Performance Optimizations
    setupPerformanceOptimizations() {
        // Lazy load images
        this.setupLazyLoading();

        // Preload critical resources
        this.preloadCriticalResources();

        // Setup service worker if available
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {
                // Service worker registration failed, continue without it
            });
        }
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');

        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for browsers without IntersectionObserver
            images.forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    }

    preloadCriticalResources() {
        const criticalImages = [
            '/static/users/images/hero.png',
            '/static/users/images/technical.png',
            '/static/users/images/behavioral.png'
        ];

        criticalImages.forEach(src => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'image';
            link.href = src;
            document.head.appendChild(link);
        });
    }

    // Utility Functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function () {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 5000);
    }

    // Error handling
    handleError(error, context) {
        console.error(`Error in ${context}:`, error);

        // In production, you might want to send this to an error tracking service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: `${context}: ${error.message}`,
                fatal: false
            });
        }
    }
}

// Initialize the landing page
try {
    new TechtonicLanding();
} catch (error) {
    console.error('Failed to initialize Techtonic Landing Page:', error);
}

// Export for potential external use
window.TechtonicLanding = TechtonicLanding;
document.addEventListener('DOMContentLoaded', function () {
    // Navigation scroll effect
    const topNav = document.querySelector('.top-nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll <= 0) {
            topNav.classList.remove('scroll-up');
            return;
        }

        if (currentScroll > lastScroll && !topNav.classList.contains('scroll-down')) {
            topNav.classList.remove('scroll-up');
            topNav.classList.add('scroll-down');
        } else if (currentScroll < lastScroll && topNav.classList.contains('scroll-down')) {
            topNav.classList.remove('scroll-down');
            topNav.classList.add('scroll-up');
        }
        lastScroll = currentScroll;
    });

    // Mobile menu toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            console.log('Mobile menu toggled');
        });

        // Close mobile menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                console.log('Mobile menu closed via link click');
            });
        });
    }

    // Testimonials slider
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const prevButton = document.querySelector('.testimonial-nav.prev');
    const nextButton = document.querySelector('.testimonial-nav.next');
    let currentTestimonial = 0;
    let testimonialInterval;

    function showTestimonial(index) {
        try {
            if (!testimonialCards.length) {
                console.error('No testimonial cards found');
                return;
            }

            testimonialCards.forEach(card => card.classList.remove('active'));
            testimonialCards[index].classList.add('active');
            console.log(`Showing testimonial ${index + 1} of ${testimonialCards.length}`);
        } catch (error) {
            console.error('Error showing testimonial:', error);
        }
    }

    function nextTestimonial() {
        try {
            currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
            showTestimonial(currentTestimonial);
        } catch (error) {
            console.error('Error moving to next testimonial:', error);
        }
    }

    function prevTestimonial() {
        try {
            currentTestimonial = (currentTestimonial - 1 + testimonialCards.length) % testimonialCards.length;
            showTestimonial(currentTestimonial);
        } catch (error) {
            console.error('Error moving to previous testimonial:', error);
        }
    }

    function startTestimonialInterval() {
        testimonialInterval = setInterval(nextTestimonial, 5000);
    }

    function stopTestimonialInterval() {
        clearInterval(testimonialInterval);
    }

    if (testimonialCards.length > 0) {
        // Initialize first testimonial
        showTestimonial(0);

        // Add event listeners for navigation
        if (prevButton && nextButton) {
            prevButton.addEventListener('click', () => {
                prevTestimonial();
                // Restart the interval when manually navigating
                stopTestimonialInterval();
                startTestimonialInterval();
            });

            nextButton.addEventListener('click', () => {
                nextTestimonial();
                // Restart the interval when manually navigating
                stopTestimonialInterval();
                startTestimonialInterval();
            });

            console.log('Testimonial navigation initialized');
        }

        // Auto-advance testimonials
        startTestimonialInterval();

        // Pause auto-advance when hovering over testimonials
        const testimonialContainer = document.querySelector('.testimonials-container');
        if (testimonialContainer) {
            testimonialContainer.addEventListener('mouseenter', stopTestimonialInterval);
            testimonialContainer.addEventListener('mouseleave', startTestimonialInterval);
        }
    } else {
        console.warn('No testimonial cards found on the page');
    }

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            try {
                e.preventDefault();
                const targetId = this.getAttribute('href');

                if (targetId === '#') return;

                const target = document.querySelector(targetId);

                if (target) {
                    const headerOffset = 80; // Adjust this value based on your header height
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    console.log(`Scrolled to ${targetId}`);
                } else {
                    console.warn(`Target element ${targetId} not found`);
                }
            } catch (error) {
                console.error('Error scrolling to section:', error);
            }
        });
    });

    // Intersection Observer for animations
    const animatedElements = document.querySelectorAll('.fade-in, .slide-up, .slide-in-left, .slide-in-right, .pop-in');

    // Add the 'animated' class to all elements
    animatedElements.forEach(el => {
        if (!el.classList.contains('fade-in') && !el.classList.contains('slide-up') &&
            !el.classList.contains('slide-in-left') && !el.classList.contains('slide-in-right') &&
            !el.classList.contains('pop-in')) {
            el.classList.add('animated');
        }
    });

    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1
    };

    // Delay for pop-in elements
    const popInElements = document.querySelectorAll('.pop-in');
    popInElements.forEach((el, index) => {
        el.style.animationDelay = `${0.2 * index}s`;
    });

    // Create an intersection observer to trigger animations when elements come into view
    try {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-view');
                    observer.unobserve(entry.target);
                    console.log(`Animation triggered for ${entry.target.tagName}${entry.target.className ? ' with class ' + entry.target.className : ''}`);
                }
            });
        }, observerOptions);

        // Observe each animated element
        document.querySelectorAll('.animated').forEach(el => {
            observer.observe(el);
        });
    } catch (error) {
        console.error('Error setting up intersection observer:', error);
        // Fallback for browsers that don't support IntersectionObserver
        document.querySelectorAll('.animated').forEach(el => {
            el.classList.add('in-view');
        });
    }

    // Form submission handling for contact form
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // In a real implementation, you would send the form data to your backend
            // For now, we'll just log it and show a success message
            try {
                const nameInput = this.querySelector('#name');
                const emailInput = this.querySelector('#email');
                const messageInput = this.querySelector('#message');

                if (nameInput && emailInput && messageInput) {
                    // Simple validation
                    if (!nameInput.value.trim()) {
                        alert('Please enter your name');
                        nameInput.focus();
                        return;
                    }

                    if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
                        alert('Please enter a valid email address');
                        emailInput.focus();
                        return;
                    }

                    if (!messageInput.value.trim()) {
                        alert('Please enter your message');
                        messageInput.focus();
                        return;
                    }

                    console.log('Form submission:', {
                        name: nameInput.value,
                        email: emailInput.value,
                        message: messageInput.value
                    });

                    // Show sending state
                    const submitButton = this.querySelector('button[type="submit"]');
                    const originalText = submitButton.textContent;
                    submitButton.textContent = 'Sending...';
                    submitButton.disabled = true;

                    // Simulate sending (would be an actual API call in production)
                    setTimeout(() => {
                        // Reset form
                        this.reset();

                        // Reset button
                        submitButton.textContent = originalText;
                        submitButton.disabled = false;

                        // Show success message
                        alert('Thank you for your message! We will get back to you soon.');
                    }, 1500);
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                alert('An error occurred while submitting the form. Please try again.');
            }
        });
    }

    // Helper function to validate email
    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
}); 
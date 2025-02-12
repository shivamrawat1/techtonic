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

    // // Mobile menu toggle
    // const navToggle = document.createElement('button');
    // navToggle.className = 'nav-toggle';
    // navToggle.innerHTML = '☰';

    // const navLinks = document.querySelector('.nav-links');
    // if (navLinks) {
    //     navLinks.parentElement.insertBefore(navToggle, navLinks);

    //     navToggle.addEventListener('click', () => {
    //         nav.classList.toggle('active');
    //     });
    // }

    // Testimonials slider
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    const prevButton = document.querySelector('.testimonial-nav.prev');
    const nextButton = document.querySelector('.testimonial-nav.next');
    let currentTestimonial = 0;

    function showTestimonial(index) {
        testimonialCards.forEach(card => card.classList.remove('active'));
        testimonialCards[index].classList.add('active');
    }

    function nextTestimonial() {
        currentTestimonial = (currentTestimonial + 1) % testimonialCards.length;
        showTestimonial(currentTestimonial);
    }

    function prevTestimonial() {
        currentTestimonial = (currentTestimonial - 1 + testimonialCards.length) % testimonialCards.length;
        showTestimonial(currentTestimonial);
    }

    if (prevButton && nextButton) {
        prevButton.addEventListener('click', prevTestimonial);
        nextButton.addEventListener('click', nextTestimonial);
    }

    // Initialize first testimonial
    showTestimonial(0);

    // Auto-advance testimonials every 5 seconds
    setInterval(nextTestimonial, 5000);

    // Smooth scroll for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 100; // Adjust this value based on your header height
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Video placeholder handler
    const videoPlaceholder = document.querySelector('.demo-video');
    if (videoPlaceholder) {
        videoPlaceholder.addEventListener('click', function () {
            // Replace with your actual video embed code
            this.innerHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/your-video-id" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            `;
        });
    }
}); 
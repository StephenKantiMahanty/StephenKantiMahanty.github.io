// Section page specific functionality
document.addEventListener('DOMContentLoaded', () => {
    // The shared script supplies the back-button transition.
    const backButton = document.querySelector('.back-button');
    
    // Keyboard shortcut to go back (ESC key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && backButton) {
            backButton.click();
        }
    });
    
    // Clickable section navigation and scroll detection
    const sectionIndicator = document.getElementById('current-section');
    const contentSections = document.querySelectorAll('.content-section');
    const sectionsArray = Array.from(contentSections);

    const sectionLinks = sectionsArray.map((section, index) => {
        const link = document.createElement('a');
        link.className = `section-link${index === 0 ? ' is-active' : ''}`;
        link.href = `#${section.id}`;
        link.textContent = `// ${section.getAttribute('data-section')}`;
        if (index === 0) link.setAttribute('aria-current', 'location');
        sectionIndicator?.appendChild(link);
        return link;
    });

    const setActiveSection = (activeSection) => {
        const activeIndex = sectionsArray.indexOf(activeSection);
        sectionLinks.forEach((link, index) => {
            const isActive = index === activeIndex;
            link.classList.toggle('is-active', isActive);
            if (isActive) {
                link.setAttribute('aria-current', 'location');
            } else {
                link.removeAttribute('aria-current');
            }
        });
        const activeLink = sectionLinks[activeIndex];
        const linkList = activeLink?.parentElement;
        if (linkList && linkList.scrollWidth > linkList.clientWidth) {
            linkList.scrollTo({
                left: Math.max(0, activeLink.offsetLeft - (linkList.clientWidth - activeLink.offsetWidth) / 2),
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });
        }
    };

    sectionLinks.forEach((link, index) => {
        link.addEventListener('click', () => setActiveSection(sectionsArray[index]));
    });
    
    // IntersectionObserver for section detection
    const observerOptions = {
        root: null,
        rootMargin: '-35% 0px -55% 0px',
        threshold: 0
    };
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setActiveSection(entry.target);
                entry.target.classList.add('in-view');
            }
        });
    }, observerOptions);
    
    // Observe all content sections
    contentSections.forEach(section => {
        sectionObserver.observe(section);
    });
    
});

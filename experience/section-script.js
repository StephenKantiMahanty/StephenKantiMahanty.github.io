// Section page specific functionality
document.addEventListener('DOMContentLoaded', () => {
    // Smooth back button transition
    const backButton = document.querySelector('.back-button');
    
    if (backButton) {
        backButton.addEventListener('click', (e) => {
            e.preventDefault();
            const targetUrl = backButton.getAttribute('href');
            
            // Add exit animation
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.4s ease-out';
            
            setTimeout(() => {
                window.location.href = targetUrl;
            }, 400);
        });
    }
    
    // Keyboard shortcut to go back (ESC key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && backButton) {
            backButton.click();
        }
    });
    
    // Section indicator and scroll detection
    const sectionIndicator = document.getElementById('current-section');
    const contentSections = document.querySelectorAll('.content-section');
    const sectionsArray = Array.from(contentSections);
    
    // Get all section names
    const allSectionNames = sectionsArray.map(section => section.getAttribute('data-section'));
    
    // IntersectionObserver for section detection
    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionName = entry.target.getAttribute('data-section');
                const currentIndex = sectionsArray.indexOf(entry.target);
                
                if (sectionIndicator) {
                    // Build the indicator HTML with all sections
                    let indicatorHTML = '';
                    
                    allSectionNames.forEach((name, index) => {
                        const isActive = index === currentIndex;
                        const className = isActive ? '' : 'inactive';
                        indicatorHTML += `<span class="${className}">// ${name}</span>`;
                    });
                    
                    sectionIndicator.innerHTML = indicatorHTML;
                }
                
                // Add in-view class for animation
                entry.target.classList.add('in-view');
            }
        });
    }, observerOptions);
    
    // Observe all content sections
    contentSections.forEach(section => {
        sectionObserver.observe(section);
    });
    
    // Glitch effect on header component
    const headerComponent = document.querySelector('.header-component-svg');
    if (headerComponent) {
        setInterval(() => {
            // Random glitch effect
            if (Math.random() > 0.95) {
                headerComponent.style.filter = 'drop-shadow(0 0 30px var(--circuit-green))';
                headerComponent.style.transform = 'translateX(2px)';
                
                setTimeout(() => {
                    headerComponent.style.filter = 'drop-shadow(0 0 15px var(--glow-green))';
                    headerComponent.style.transform = 'translateX(0)';
                }, 100);
            }
        }, 1000);
    }
});

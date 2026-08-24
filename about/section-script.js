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
    
});

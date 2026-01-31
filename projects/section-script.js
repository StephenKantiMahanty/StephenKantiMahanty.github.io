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
    
    // Add entrance animation for content
    const contentWrapper = document.querySelector('.content-wrapper');
    if (contentWrapper) {
        // Simulate data loading effect
        setTimeout(() => {
            contentWrapper.style.transform = 'scale(1.02)';
            setTimeout(() => {
                contentWrapper.style.transform = 'scale(1)';
            }, 200);
        }, 1000);
    }
    
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
    
    // Keyboard shortcut to go back (ESC key)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && backButton) {
            backButton.click();
        }
    });
    
    // Add power indicator to content wrapper
    const contentWrapperElement = document.querySelector('.content-wrapper');
    if (contentWrapperElement) {
        const powerIndicator = document.createElement('div');
        powerIndicator.style.position = 'absolute';
        powerIndicator.style.top = '20px';
        powerIndicator.style.right = '20px';
        powerIndicator.style.display = 'flex';
        powerIndicator.style.alignItems = 'center';
        powerIndicator.style.gap = '8px';
        powerIndicator.style.fontSize = '0.8rem';
        powerIndicator.style.color = 'var(--accent-green)';
        powerIndicator.style.opacity = '0.6';
        
        const indicator = document.createElement('div');
        indicator.style.width = '8px';
        indicator.style.height = '8px';
        indicator.style.borderRadius = '50%';
        indicator.style.background = 'var(--circuit-green)';
        indicator.style.boxShadow = '0 0 10px var(--circuit-green)';
        indicator.style.animation = 'blink 2s ease-in-out infinite';
        
        const text = document.createElement('span');
        text.textContent = 'ACTIVE';
        
        powerIndicator.appendChild(indicator);
        powerIndicator.appendChild(text);
        contentWrapperElement.appendChild(powerIndicator);
        
        // Add blink animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
    }
});

// Smooth page transitions
document.addEventListener('DOMContentLoaded', () => {
    // Add click sound effect simulation through visual feedback
    const components = document.querySelectorAll('.component');
    
    components.forEach(component => {
        component.addEventListener('click', (e) => {
            // Create ripple effect
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.width = '10px';
            ripple.style.height = '10px';
            ripple.style.background = 'var(--circuit-green)';
            ripple.style.borderRadius = '50%';
            ripple.style.pointerEvents = 'none';
            ripple.style.left = e.clientX + 'px';
            ripple.style.top = e.clientY + 'px';
            ripple.style.transform = 'translate(-50%, -50%)';
            ripple.style.animation = 'rippleEffect 0.6s ease-out';
            ripple.style.zIndex = '1000';
            
            document.body.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
            
            // Add flash effect to the component
            const componentType = component.dataset.component;
            component.style.filter = 'brightness(1.5)';
            setTimeout(() => {
                component.style.filter = '';
            }, 200);
        });
        
        // Hover effect for traces
        component.addEventListener('mouseenter', () => {
            const traces = document.querySelectorAll('.trace');
            traces.forEach(trace => {
                trace.style.stroke = 'var(--accent-green)';
                trace.style.strokeWidth = '4';
            });
        });
        
        component.addEventListener('mouseleave', () => {
            const traces = document.querySelectorAll('.trace');
            traces.forEach(trace => {
                trace.style.stroke = 'var(--circuit-green)';
                trace.style.strokeWidth = '3';
            });
        });
    });
    
    // Voltage bar animation
    const voltageValue = document.querySelector('.voltage-value');
    const voltageFill = document.querySelector('.voltage-fill');
    
    setInterval(() => {
        const voltage = (4.95 + Math.random() * 0.1).toFixed(2);
        voltageValue.textContent = voltage + 'V';
        
        const fillPercent = ((voltage - 4.95) / 0.1) * 100;
        voltageFill.style.opacity = 0.8 + (fillPercent / 1000);
    }, 2000);
    
    // Smooth scroll and page transitions
    window.addEventListener('beforeunload', () => {
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.3s ease-out';
    });
    
    // Custom cursor trail effect
    let cursorTrail = [];
    const maxTrailLength = 5;
    
    document.addEventListener('mousemove', (e) => {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.position = 'fixed';
        trail.style.width = '4px';
        trail.style.height = '4px';
        trail.style.background = 'var(--circuit-green)';
        trail.style.borderRadius = '50%';
        trail.style.pointerEvents = 'none';
        trail.style.left = e.clientX + 'px';
        trail.style.top = e.clientY + 'px';
        trail.style.transform = 'translate(-50%, -50%)';
        trail.style.zIndex = '9998';
        trail.style.opacity = '0.5';
        trail.style.transition = 'all 0.5s ease-out';
        
        document.body.appendChild(trail);
        cursorTrail.push(trail);
        
        if (cursorTrail.length > maxTrailLength) {
            const oldTrail = cursorTrail.shift();
            oldTrail.style.opacity = '0';
            oldTrail.style.transform = 'translate(-50%, -50%) scale(0)';
            setTimeout(() => oldTrail.remove(), 500);
        }
        
        setTimeout(() => {
            trail.style.opacity = '0';
            trail.style.transform = 'translate(-50%, -50%) scale(0)';
        }, 300);
    });
    
    // Keyboard navigation
    let currentComponentIndex = 0;
    const componentElements = Array.from(components);
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            currentComponentIndex = (currentComponentIndex + 1) % componentElements.length;
            componentElements[currentComponentIndex].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            currentComponentIndex = (currentComponentIndex - 1 + componentElements.length) % componentElements.length;
            componentElements[currentComponentIndex].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
            if (document.activeElement.classList.contains('component')) {
                e.preventDefault();
                document.activeElement.click();
            }
        }
    });
    
    // Add focus styles programmatically
    components.forEach(component => {
        component.setAttribute('tabindex', '0');
        
        component.addEventListener('focus', () => {
            component.style.outline = '2px solid var(--circuit-green)';
            component.style.outlineOffset = '10px';
        });
        
        component.addEventListener('blur', () => {
            component.style.outline = 'none';
        });
    });
});

// Add ripple animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes rippleEffect {
        0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
            box-shadow: 0 0 0px var(--circuit-green);
        }
        100% {
            transform: translate(-50%, -50%) scale(20);
            opacity: 0;
            box-shadow: 0 0 30px var(--circuit-green);
        }
    }
`;
document.head.appendChild(style);

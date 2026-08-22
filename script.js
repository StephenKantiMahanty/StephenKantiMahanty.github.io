// Shared navigation, interaction, and accessibility behavior.
document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const components = Array.from(document.querySelectorAll('.component'));
    const navigationLinks = document.querySelectorAll('.component, .back-button');
    const traces = document.querySelectorAll('.trace');

    // Give internal navigation enough time to show its circuit-box confirmation.
    navigationLinks.forEach(link => {
        link.addEventListener('click', event => {
            const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
            const opensElsewhere = link.target && link.target !== '_self';

            if (event.defaultPrevented || isModifiedClick || opensElsewhere || link.hasAttribute('download')) {
                return;
            }

            event.preventDefault();

            if (document.body.classList.contains('page-leaving')) {
                return;
            }

            link.classList.add('is-activating');

            if (prefersReducedMotion) {
                window.location.assign(link.href);
                return;
            }

            window.setTimeout(() => {
                document.body.classList.add('page-leaving');
            }, 180);

            window.setTimeout(() => {
                window.location.assign(link.href);
            }, 380);
        });
    });

    // Highlight the complete circuit path while a navigation component is engaged.
    components.forEach(component => {
        const setTraceState = active => {
            traces.forEach(trace => {
                trace.style.stroke = active ? 'var(--accent-green)' : '';
                trace.style.strokeWidth = active ? '4' : '';
            });
        };

        component.addEventListener('mouseenter', () => setTraceState(true));
        component.addEventListener('mouseleave', () => setTraceState(false));
        component.addEventListener('focus', () => setTraceState(true));
        component.addEventListener('blur', () => setTraceState(false));
    });

    // Keep the voltage display alive only on the homepage.
    const voltageValue = document.querySelector('.voltage-value');
    const voltageFill = document.querySelector('.voltage-fill');

    if (voltageValue && voltageFill && !prefersReducedMotion) {
        window.setInterval(() => {
            const voltage = (4.95 + Math.random() * 0.1).toFixed(2);
            voltageValue.textContent = `${voltage}V`;

            const fillPercent = ((voltage - 4.95) / 0.1) * 100;
            voltageFill.style.opacity = 0.8 + (fillPercent / 1000);
        }, 2000);
    }

    // Arrow keys cycle through the three homepage components.
    if (components.length) {
        let currentComponentIndex = 0;

        document.addEventListener('keydown', event => {
            const activeIndex = components.indexOf(document.activeElement);
            if (activeIndex >= 0) {
                currentComponentIndex = activeIndex;
            }

            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                event.preventDefault();
                currentComponentIndex = (currentComponentIndex + 1) % components.length;
                components[currentComponentIndex].focus();
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                event.preventDefault();
                currentComponentIndex = (currentComponentIndex - 1 + components.length) % components.length;
                components[currentComponentIndex].focus();
            } else if (event.key === ' ' && document.activeElement.classList.contains('component')) {
                event.preventDefault();
                document.activeElement.click();
            }
        });
    }
});

// Restore pages returned from the browser's back/forward cache.
window.addEventListener('pageshow', () => {
    document.body.classList.remove('page-leaving');
    document.querySelectorAll('.is-activating').forEach(element => {
        element.classList.remove('is-activating');
    });
});

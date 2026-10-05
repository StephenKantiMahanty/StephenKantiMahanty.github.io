// Shared navigation, motion, and accessibility behavior.
document.addEventListener('DOMContentLoaded', () => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const prefersReducedMotion = motionQuery.matches;
    const root = document.documentElement;
    const body = document.body;
    const components = Array.from(document.querySelectorAll('.component'));
    const navigationLinks = document.querySelectorAll('.component, .back-button, .secret-projects-link');
    const traces = Array.from(document.querySelectorAll('.trace'));

    // Let internal navigation acknowledge the click before leaving the page.
    navigationLinks.forEach(link => {
        link.addEventListener('click', event => {
            const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
            const opensElsewhere = link.target && link.target !== '_self';

            if (event.defaultPrevented || isModifiedClick || opensElsewhere || link.hasAttribute('download')) {
                return;
            }

            event.preventDefault();

            if (body.classList.contains('page-leaving')) {
                return;
            }

            link.classList.add('is-activating');

            if (prefersReducedMotion) {
                window.location.assign(link.href);
                return;
            }

            window.setTimeout(() => body.classList.add('page-leaving'), 120);
            window.setTimeout(() => window.location.assign(link.href), 285);
        });
    });

    const setRouteState = route => {
        traces.forEach(trace => {
            const belongsToRoute = trace.dataset.route === route || trace.dataset.route === 'shared';
            trace.classList.toggle('route-active', Boolean(route && belongsToRoute));
            trace.classList.toggle('route-muted', Boolean(route && !belongsToRoute));
        });
    };

    // Navigation components track the local pointer glow and illuminate only their route.
    components.forEach(component => {
        const route = component.dataset.component;

        component.addEventListener('mouseenter', () => setRouteState(route));
        component.addEventListener('mouseleave', () => setRouteState(null));
        component.addEventListener('focus', () => setRouteState(route));
        component.addEventListener('blur', () => setRouteState(null));

        component.addEventListener('pointermove', event => {
            if (!finePointerQuery.matches || prefersReducedMotion) return;

            const rect = component.getBoundingClientRect();
            const localX = event.clientX - rect.left;
            const localY = event.clientY - rect.top;

            component.style.setProperty('--local-x', `${localX}px`);
            component.style.setProperty('--local-y', `${localY}px`);
        });
    });

    // Spotlight treatment for content cards, adapted to the existing static pages.
    document.querySelectorAll('.section-content-area').forEach(card => {
        card.addEventListener('pointermove', event => {
            if (!finePointerQuery.matches) return;
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--local-x', `${event.clientX - rect.left}px`);
            card.style.setProperty('--local-y', `${event.clientY - rect.top}px`);
        });
    });

    // A restrained magnetic response for the fixed back button.
    document.querySelectorAll('.back-button').forEach(button => {
        button.addEventListener('pointermove', event => {
            if (!finePointerQuery.matches || prefersReducedMotion) return;
            const rect = button.getBoundingClientRect();
            const x = (event.clientX - (rect.left + rect.width / 2)) / 10;
            const y = (event.clientY - (rect.top + rect.height / 2)) / 10;
            button.style.setProperty('--magnet-x', `${x}px`);
            button.style.setProperty('--magnet-y', `${y}px`);
        });

        button.addEventListener('pointerleave', () => {
            button.style.setProperty('--magnet-x', '0px');
            button.style.setProperty('--magnet-y', '0px');
        });
    });

    const voltageValue = document.querySelector('.voltage-value');
    const voltageControl = document.querySelector('.voltage-control');
    const sparkCanvas = document.querySelector('.spark-canvas');
    const circuitSvg = document.querySelector('.circuit-traces');
    let currentVoltage = voltageControl ? Number(voltageControl.value) : 5;

    const setVoltage = voltage => {
        currentVoltage = Number(voltage);
        const percent = ((currentVoltage - 3.3) / (9 - 3.3)) * 100;
        root.style.setProperty('--signal-level', String(percent / 100));
        root.style.setProperty('--signal-glow', `${9 + percent * 0.06}px`);
        root.style.setProperty('--voltage-percent', `${percent}%`);
        if (voltageValue) voltageValue.textContent = `${currentVoltage.toFixed(1)}V`;
    };

    if (voltageControl) {
        setVoltage(voltageControl.value);
        voltageControl.addEventListener('input', event => setVoltage(event.target.value));
    }

    const createGridRipple = (x, y) => {
        if (prefersReducedMotion) return;
        const ripple = document.createElement('span');
        ripple.className = 'grid-ripple';
        ripple.style.setProperty('--ripple-x', `${x}px`);
        ripple.style.setProperty('--ripple-y', `${y}px`);
        body.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    };

    const pulseCircuit = (originX = window.innerWidth / 2, originY = window.innerHeight / 2) => {
        if (!circuitSvg) return;

        const duration = Math.max(520, 1250 - currentVoltage * 70);
        const routePaths = Array.from(circuitSvg.querySelectorAll('.trace'));

        routePaths.forEach((trace, index) => {
            const burst = trace.cloneNode(false);
            burst.removeAttribute('class');
            burst.removeAttribute('data-route');
            burst.setAttribute('class', 'signal-burst');
            burst.setAttribute('pathLength', '1');
            burst.style.setProperty('--pulse-duration', `${duration}ms`);
            burst.style.animationDelay = `${Math.min(index * 28, 170)}ms`;
            circuitSvg.appendChild(burst);
            burst.addEventListener('animationend', () => burst.remove(), { once: true });
        });

        createGridRipple(originX, originY);

    };

    // Canvas click sparks, adapted from the local ReactBits ClickSpark pattern.
    if (sparkCanvas && !prefersReducedMotion) {
        const context = sparkCanvas.getContext('2d');
        const sparks = [];
        let canvasScale = Math.min(window.devicePixelRatio || 1, 2);
        let sparkFrame = 0;

        const resizeCanvas = () => {
            canvasScale = Math.min(window.devicePixelRatio || 1, 2);
            sparkCanvas.width = Math.round(window.innerWidth * canvasScale);
            sparkCanvas.height = Math.round(window.innerHeight * canvasScale);
            sparkCanvas.style.width = `${window.innerWidth}px`;
            sparkCanvas.style.height = `${window.innerHeight}px`;
            context.setTransform(canvasScale, 0, 0, canvasScale, 0, 0);
        };

        const addSparks = (x, y) => {
            const now = performance.now();
            const count = 8;
            const energy = 0.8 + currentVoltage / 12;
            for (let index = 0; index < count; index += 1) {
                sparks.push({
                    x,
                    y,
                    angle: (Math.PI * 2 * index) / count,
                    startedAt: now,
                    radius: 16 * energy,
                    length: 8 * energy
                });
            }

            if (!sparkFrame) sparkFrame = window.requestAnimationFrame(drawSparks);
        };

        const drawSparks = timestamp => {
            context.clearRect(0, 0, window.innerWidth, window.innerHeight);

            for (let index = sparks.length - 1; index >= 0; index -= 1) {
                const spark = sparks[index];
                const progress = (timestamp - spark.startedAt) / 430;
                if (progress >= 1) {
                    sparks.splice(index, 1);
                    continue;
                }

                const eased = progress * (2 - progress);
                const distance = eased * spark.radius;
                const lineLength = spark.length * (1 - eased);
                const startX = spark.x + distance * Math.cos(spark.angle);
                const startY = spark.y + distance * Math.sin(spark.angle);

                context.globalAlpha = 1 - progress;
                context.strokeStyle = '#b8ffc8';
                context.lineWidth = 1.5;
                context.beginPath();
                context.moveTo(startX, startY);
                context.lineTo(
                    startX + lineLength * Math.cos(spark.angle),
                    startY + lineLength * Math.sin(spark.angle)
                );
                context.stroke();
            }

            context.globalAlpha = 1;
            sparkFrame = sparks.length ? window.requestAnimationFrame(drawSparks) : 0;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas, { passive: true });

        body.addEventListener('pointerdown', event => {
            if (event.button !== 0 || event.target.closest('a, button, input')) return;
            body.classList.add('is-pressing');
            addSparks(event.clientX, event.clientY);
            pulseCircuit(event.clientX, event.clientY);
        });

        window.addEventListener('pointerup', () => body.classList.remove('is-pressing'));
    }

    // Arrow keys cycle the homepage links; Space injects a pulse when focus is elsewhere.
    if (components.length) {
        let currentComponentIndex = 0;

        document.addEventListener('keydown', event => {
            // Leave other controls, including the voltage slider, to their native keys.
            if (event.target.closest('a, button, input, select, textarea, [contenteditable]') &&
                !event.target.closest('.component')) return;

            const activeIndex = components.indexOf(document.activeElement);
            if (activeIndex >= 0) currentComponentIndex = activeIndex;

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

    window.setTimeout(() => body.classList.add('is-ready'), prefersReducedMotion ? 0 : 1250);
});

// Restore pages returned from the browser's back/forward cache.
window.addEventListener('pageshow', () => {
    document.body.classList.remove('page-leaving');
    document.querySelectorAll('.is-activating').forEach(element => {
        element.classList.remove('is-activating');
    });
});

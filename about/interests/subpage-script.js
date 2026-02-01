// subpage-script.js
// Copy into every sub-subpage folder. Don't edit.
// Does two things: scroll-reveal on image blocks, and lightbox on click.

document.addEventListener('DOMContentLoaded', () => {

    // ---- Scroll Reveal ----
    // Watches each .image-block and adds .visible once it's scrolled into view.
    const blocks = document.querySelectorAll('.image-block');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.15  // triggers when 15% of the block is visible
    });

    blocks.forEach((block) => observer.observe(block));


    // ---- Lightbox ----
    const overlay   = document.getElementById('lightbox');
    const lightImg  = document.getElementById('lightbox-img');
    const closeBtn  = document.getElementById('lightbox-close');

    function openLightbox(src, alt) {
        lightImg.src = src;
        lightImg.alt = alt;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Click any image frame to open
    document.querySelectorAll('.image-frame').forEach((frame) => {
        frame.addEventListener('click', () => {
            const img = frame.querySelector('img');
            openLightbox(img.src, img.alt);
        });
    });

    // Close on overlay background or close button
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target === closeBtn) closeLightbox();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });


    // ---- Smooth back-button transition ----
    const backButtons = document.querySelectorAll('.back-button, .footer-back-link');

    backButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.35s ease-out';
            setTimeout(() => {
                window.location.href = btn.getAttribute('href');
            }, 350);
        });
    });
});

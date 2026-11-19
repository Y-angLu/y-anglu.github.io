// Shared image viewer — same implementation as Step 1.
(function () {
    const viewer = document.getElementById('image-lightbox');
    if (!viewer) return;

    const media = document.getElementById('lightbox-media');
    const caption = document.getElementById('lightbox-caption');
    const counter = document.getElementById('lightbox-counter');
    const closeButton = document.getElementById('lightbox-close');
    const previousButton = document.getElementById('lightbox-prev');
    const nextButton = document.getElementById('lightbox-next');
    if (![media, caption, counter, closeButton, previousButton, nextButton].every(Boolean)) return;

    // Keep explicit galleries; register remaining article images individually.
    // Do not hijack links or video-player buttons.
    document.querySelectorAll('main img[src]').forEach(image => {
        if (image.closest('[data-lightbox-item], a, button')) return;
        const parent = image.parentElement;
        const containsMultipleImages = parent && parent.querySelectorAll('img').length > 1;
        const containsControls = parent && parent.querySelector('button, a, iframe');
        const target = parent && !containsMultipleImages && !containsControls ? parent : image;
        if (!target || target.closest('[data-lightbox-item]')) return;

        target.setAttribute('data-lightbox-item', '');
        target.setAttribute('role', 'button');
        target.setAttribute('tabindex', '0');
        target.setAttribute('aria-label', 'Expand image: ' + (image.alt || 'Project image'));
    });

    // Allow deliberately labelled unfinished figure slots, but not arbitrary boxes.
    document.querySelectorAll('main .aspect-square, main .aspect-video, main [class*="aspect-["]').forEach(target => {
        if (target.hasAttribute('data-lightbox-item') ||
            target.closest('a, button') ||
            target.querySelector('img, [data-lightbox-item], button, a')) return;
        const text = target.textContent.trim();
        if (!/image placeholder/i.test(text)) return;
        target.setAttribute('data-lightbox-item', '');
        target.setAttribute('role', 'button');
        target.setAttribute('tabindex', '0');
        target.setAttribute('aria-label', 'Expand image placeholder');
        target.dataset.caption = text;
    });

    const items = [...document.querySelectorAll('main [data-lightbox-item]')];
    let currentIndex = -1;
    let previousFocus = null;
    let previousOverflow = '';
    let touchStartX = null;
    let changeTimer = null;

    function render(index) {
        if (!items.length) return;
        currentIndex = (index + items.length) % items.length;
        const item = items[currentIndex];
        const source = item.matches('img') ? item : item.querySelector('img');
        const figureCaption = item.querySelector('figcaption');
        const description = item.dataset.caption ||
            (figureCaption && figureCaption.textContent.trim()) ||
            (source && source.alt) ||
            item.textContent.trim().replace(/\s+/g, ' ') || 'Project image';

        media.replaceChildren();
        if (source && source.getAttribute('src')) {
            const image = document.createElement('img');
            image.src = source.currentSrc || source.src;
            image.alt = source.alt || description;
            media.appendChild(image);
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'image-lightbox-placeholder';
            const title = document.createElement('strong');
            title.textContent = description;
            const note = document.createElement('span');
            note.textContent = 'Image placeholder — add your figure or equation screenshot here.';
            placeholder.append(title, note);
            media.appendChild(placeholder);
        }
        caption.textContent = description;
        counter.textContent = `${currentIndex + 1} / ${items.length}`;
    }

    function navigate(index) {
        if (currentIndex < 0) return;
        if (changeTimer) clearTimeout(changeTimer);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            render(index);
            return;
        }
        media.classList.add('is-changing');
        caption.classList.add('is-changing');
        changeTimer = setTimeout(() => {
            render(index);
            media.classList.remove('is-changing');
            caption.classList.remove('is-changing');
            changeTimer = null;
        }, 125);
    }

    function open(index) {
        if (!items.length) return;
        previousFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;
        render(index);
        viewer.classList.add('is-open');
        viewer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeButton.focus();
    }

    function close() {
        if (currentIndex < 0) return;
        if (changeTimer) clearTimeout(changeTimer);
        changeTimer = null;
        media.classList.remove('is-changing');
        caption.classList.remove('is-changing');
        viewer.classList.remove('is-open');
        viewer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = previousOverflow;
        currentIndex = -1;
        if (previousFocus && previousFocus.isConnected && previousFocus.focus) {
            previousFocus.focus();
        }
    }

    items.forEach((item, index) => {
        item.addEventListener('click', () => open(index));
        item.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open(index);
            }
        });
    });

    closeButton.addEventListener('click', close);
    previousButton.addEventListener('click', () => navigate(currentIndex - 1));
    nextButton.addEventListener('click', () => navigate(currentIndex + 1));
    viewer.addEventListener('click', event => {
        if (event.target === viewer) close();
    });
    document.addEventListener('keydown', event => {
        if (currentIndex < 0) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            navigate(currentIndex - 1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            navigate(currentIndex + 1);
        } else if (event.key === 'Tab') {
            const controls = [closeButton, previousButton, nextButton];
            const focusedIndex = controls.indexOf(document.activeElement);
            if (focusedIndex === -1) {
                event.preventDefault();
                (event.shiftKey ? nextButton : closeButton).focus();
            } else if (event.shiftKey && focusedIndex === 0) {
                event.preventDefault();
                nextButton.focus();
            } else if (!event.shiftKey && focusedIndex === controls.length - 1) {
                event.preventDefault();
                closeButton.focus();
            }
        }
    });
    media.addEventListener('touchstart', event => {
        touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });
    media.addEventListener('touchend', event => {
        if (touchStartX === null || currentIndex < 0) return;
        const difference = event.changedTouches[0].screenX - touchStartX;
        if (Math.abs(difference) > 55) navigate(currentIndex + (difference < 0 ? 1 : -1));
        touchStartX = null;
    }, { passive: true });
})();

// Shared image viewer: decode before insertion, preserve the current frame until ready.
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

    // Make standalone article images expandable without affecting linked images.
    document.querySelectorAll('main img[src]').forEach(image => {
        if (image.closest('[data-lightbox-item], a, button')) return;
        const parent = image.parentElement;
        const multiple = parent && parent.querySelectorAll('img').length > 1;
        const controls = parent && parent.querySelector('button, a, iframe');
        const target = parent && !multiple && !controls ? parent : image;
        if (!target || target.closest('[data-lightbox-item]')) return;
        target.setAttribute('data-lightbox-item', '');
        target.setAttribute('role', 'button');
        target.setAttribute('tabindex', '0');
        target.setAttribute('aria-label', 'Expand image: ' + (image.alt || 'Project image'));
    });

    document.querySelectorAll('main .aspect-square, main .aspect-video, main [class*="aspect-\["]').forEach(target => {
        if (target.hasAttribute('data-lightbox-item') ||
            target.closest('a, button') ||
            target.querySelector('img, [data-lightbox-item], button, a')) return;
        const label = target.textContent.trim();
        if (!/image placeholder/i.test(label)) return;
        target.setAttribute('data-lightbox-item', '');
        target.setAttribute('role', 'button');
        target.setAttribute('tabindex', '0');
        target.setAttribute('aria-label', 'Expand image placeholder');
        target.dataset.caption = label;
    });

    const items = [...document.querySelectorAll('main [data-lightbox-item]')];
    const cache = new Map();
    const MAX_CACHED_IMAGES = 5;
    let currentIndex = -1;
    let requestToken = 0;
    let previousFocus = null;
    let previousOverflow = '';
    let touchStartX = null;
    let loadingTimer = null;
    let cleanupTimer = null;
    let prefetchTimer = null;

    function getItem(index) {
        const item = items[(index + items.length) % items.length];
        const source = item.matches('img') ? item : item.querySelector('img');
        const figureCaption = item.querySelector('figcaption');
        const description = item.dataset.caption ||
            (figureCaption && figureCaption.textContent.trim()) ||
            (source && source.alt) ||
            item.textContent.trim().replace(/\s+/g, ' ') || 'Project image';
        const preview = source && source.getAttribute('src') ?
            (source.currentSrc || source.src) : null;
        const full = source && source.dataset.fullSrc ?
            new URL(source.dataset.fullSrc, document.baseURI).href : preview;
        return { description, preview, full };
    }

    // Important: append the *same decoded Image instance*. Cloning it creates
    // a fresh image element which may not be ready to paint, causing a blank flash.
    function loadDecoded(url) {
        if (cache.has(url)) {
            const cached = cache.get(url);
            cache.delete(url);
            cache.set(url, cached);
            return cached;
        }
        const image = new Image();
        image.decoding = 'sync';
        const promise = (async () => {
            image.src = url;
            if (typeof image.decode === 'function') {
                await image.decode();
            } else {
                await new Promise((resolve, reject) => {
                    image.onload = resolve;
                    image.onerror = () => reject(new Error('Image failed: ' + url));
                    if (image.complete) image.naturalWidth ? resolve() : reject(new Error('Image failed: ' + url));
                });
            }
            if (!image.naturalWidth) throw new Error('Image decoded without dimensions: ' + url);
            return image;
        })().catch(error => {
            cache.delete(url);
            throw error;
        });
        cache.set(url, promise);
        if (cache.size > MAX_CACHED_IMAGES) cache.delete(cache.keys().next().value);
        return promise;
    }

    function setLoading(isLoading) {
        clearTimeout(loadingTimer);
        media.setAttribute('aria-busy', String(isLoading));
        if (isLoading) {
            loadingTimer = setTimeout(() => {
                if (media.getAttribute('aria-busy') === 'true') media.classList.add('is-loading');
            }, 500);
        } else {
            media.classList.remove('is-loading');
        }
    }

    function displayImage(decoded, url, description, index, token) {
        if (token !== requestToken || currentIndex < 0) return;
        const existing = media.querySelector('img');
        if (existing !== decoded) {
            decoded.className = 'image-lightbox-frame is-visible';
            decoded.alt = description;
            decoded.draggable = false;
            decoded.dataset.imageUrl = url;
            // A single synchronous DOM operation, after the new image has decoded.
            // No opacity animation, no cloned images, and no blank intermediate frame.
            media.replaceChildren(decoded);
        } else {
            decoded.alt = description;
        }
        caption.textContent = description;
        caption.scrollTop = 0;
        counter.textContent = `${index + 1} / ${items.length}`;
        setLoading(false);
    }

    function displayPlaceholder(description, message, index, token) {
        if (token !== requestToken || currentIndex < 0) return;
        const placeholder = document.createElement('div');
        placeholder.className = 'image-lightbox-placeholder';
        const title = document.createElement('strong');
        title.textContent = description;
        const note = document.createElement('span');
        note.textContent = message;
        placeholder.append(title, note);
        media.replaceChildren(placeholder);
        caption.textContent = description;
        counter.textContent = `${index + 1} / ${items.length}`;
        setLoading(false);
    }

    function prefetchNeighbors(index, token) {
        clearTimeout(prefetchTimer);
        prefetchTimer = setTimeout(() => {
            if (token !== requestToken || currentIndex < 0 || items.length < 2) return;
            const connection = navigator.connection;
            if (connection && (connection.saveData || /^(?:slow-2g|2g)$/.test(connection.effectiveType))) return;
            const next = getItem(index + 1);
            // Prefetch the next *full* WebP, so navigation only needs one swap.
            // Avoid prefetching large original PNGs or JPEGs.
            if (next.full && /\.webp(?:[?#]|$)/i.test(next.full)) {
                loadDecoded(next.full).catch(() => {});
            }
        }, 350);
    }

    async function render(index, opening = false) {
        if (!items.length) return;
        const token = ++requestToken;
        currentIndex = (index + items.length) % items.length;
        const active = currentIndex;
        const { description, preview, full } = getItem(active);
        clearTimeout(prefetchTimer);

        if (!preview) {
            displayPlaceholder(description, 'Image placeholder — add your figure or equation screenshot here.', active, token);
            return;
        }

        setLoading(true);
        // Only on the initial open, show the small image while a large technical
        // original is downloading. During next/previous, retain the OLD image.
        if (opening && full !== preview) {
            try {
                const decodedPreview = await loadDecoded(preview);
                if (token === requestToken && currentIndex >= 0) {
                    displayImage(decodedPreview, preview, description, active, token);
                    setLoading(true);
                }
            } catch (_) { /* Continue to the full-size source. */ }
        }

        try {
            const decodedFull = await loadDecoded(full || preview);
            if (token !== requestToken || currentIndex < 0) return;
            displayImage(decodedFull, full || preview, description, active, token);
            prefetchNeighbors(active, token);
        } catch (_) {
            if (token !== requestToken || currentIndex < 0) return;
            if (preview !== full) {
                try {
                    const decodedPreview = await loadDecoded(preview);
                    if (token !== requestToken || currentIndex < 0) return;
                    displayImage(decodedPreview, preview, description, active, token);
                    prefetchNeighbors(active, token);
                    return;
                } catch (_) { /* Show a useful failure message below. */ }
            }
            displayPlaceholder(description, 'This image could not be loaded.', active, token);
        }
    }

    function open(index) {
        if (!items.length) return;
        clearTimeout(cleanupTimer);
        previousFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;
        media.replaceChildren();
        viewer.classList.add('is-open');
        viewer.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        render(index, true);
        closeButton.focus({ preventScroll: true });
    }

    function close() {
        if (currentIndex < 0) return;
        ++requestToken;
        clearTimeout(prefetchTimer);
        setLoading(false);
        viewer.classList.remove('is-open');
        viewer.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = previousOverflow;
        currentIndex = -1;
        cleanupTimer = setTimeout(() => {
            if (currentIndex < 0) media.replaceChildren();
        }, 280);
        if (previousFocus && previousFocus.isConnected && previousFocus.focus) {
            previousFocus.focus({ preventScroll: true });
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
    previousButton.addEventListener('click', () => { if (currentIndex >= 0) render(currentIndex - 1); });
    nextButton.addEventListener('click', () => { if (currentIndex >= 0) render(currentIndex + 1); });
    viewer.addEventListener('click', event => { if (event.target === viewer) close(); });
    document.addEventListener('keydown', event => {
        if (currentIndex < 0) return;
        if (event.key === 'Escape') {
            event.preventDefault();
            close();
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            render(currentIndex - 1);
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            render(currentIndex + 1);
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
        if (Math.abs(difference) > 55) render(currentIndex + (difference < 0 ? 1 : -1));
        touchStartX = null;
    }, { passive: true });
})();

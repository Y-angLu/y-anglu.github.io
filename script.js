const COLOUR_RETURN_KEY = 'portfolio-colour-return';
const COLOUR_INITIAL_KEY = 'portfolio-colour-initial';
const COLOUR_ACTIVE_KEY = 'portfolio-colour-active';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    initSkills();
    initPlayfulTiles();
    initSubpageNavigation();

    // Reveal the selected destination after its initial layout is ready.
    function revealHomepage() {
        document.documentElement.classList.remove('homepage-departing');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            document.documentElement.classList.remove('homepage-arriving');
        }));
    }
    revealHomepage();
    window.addEventListener('pageshow', event => {
        if (event.persisted) {
            document.documentElement.classList.add('homepage-arriving');
            // On BFCache restoration, the tab and theme pageshow handlers run first.
            requestAnimationFrame(() => requestAnimationFrame(() => {
                document.documentElement.classList.remove('homepage-arriving', 'homepage-departing');
            }));
        }
    });
});

function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('theme-toggle-moon');
    const sunIcon = document.getElementById('theme-toggle-sun');
    const colourIcon = document.getElementById('theme-toggle-colour');

    if (!themeToggleBtn || !moonIcon || !sunIcon || !colourIcon) return;

    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
    ).matches;

    const fallbackTheme = savedTheme === 'light' || savedTheme === 'dark'
        ? savedTheme
        : (systemPrefersDark ? 'dark' : 'light');

    // Reloads reset Colour Mode; returning from subpages restores it.
    const navigation = performance.getEntriesByType('navigation')[0];
    const isReload = navigation && navigation.type === 'reload';

    if (isReload) sessionStorage.removeItem(COLOUR_ACTIVE_KEY);

    const returningFromColour = !isReload && (
        sessionStorage.getItem(COLOUR_RETURN_KEY) === '1' ||
        sessionStorage.getItem(COLOUR_ACTIVE_KEY) === '1'
    );

    let initialTheme = returningFromColour
        ? sessionStorage.getItem(COLOUR_INITIAL_KEY) || fallbackTheme
        : fallbackTheme;

    if (initialTheme !== 'dark' && initialTheme !== 'light') {
        initialTheme = fallbackTheme;
    }

    let clickCount = returningFromColour ? 2 : 0;
    let currentTheme = returningFromColour ? 'colour' : initialTheme;

    // Consume the return marker.
    sessionStorage.removeItem(COLOUR_RETURN_KEY);
    sessionStorage.removeItem(COLOUR_INITIAL_KEY);

    function applyTheme() {
        const root = document.documentElement;
        const isDark = currentTheme === 'dark';

        root.classList.toggle('dark', isDark);
        root.classList.toggle('colour-mode', currentTheme === 'colour');

        root.style.backgroundColor = isDark ? '#121212' : '#fafafa';
        root.style.colorScheme = isDark ? 'dark' : 'light';

        moonIcon.classList.add('hidden');
        sunIcon.classList.add('hidden');
        colourIcon.classList.add('hidden');

        // Display the icon representing the next theme.
        if (clickCount === 0) {
            (initialTheme === 'dark' ? sunIcon : moonIcon)
                .classList.remove('hidden');
        } else if (clickCount === 1) {
            colourIcon.classList.remove('hidden');
        } else {
            (initialTheme === 'dark' ? moonIcon : sunIcon)
                .classList.remove('hidden');
        }
    }

    sessionStorage.setItem(COLOUR_ACTIVE_KEY, currentTheme === 'colour' ? '1' : '0');
    applyTheme();

    themeToggleBtn.addEventListener('click', () => {
        clickCount = (clickCount + 1) % 3;

        if (clickCount === 0) {
            currentTheme = initialTheme;
        } else if (clickCount === 1) {
            currentTheme = initialTheme === 'dark' ? 'light' : 'dark';
        } else {
            currentTheme = 'colour';
        }

        if (currentTheme !== 'colour') {
            localStorage.setItem('theme', currentTheme);
        }

        sessionStorage.setItem(COLOUR_ACTIVE_KEY, currentTheme === 'colour' ? '1' : '0');
        applyTheme();
    });

    // Handle restoration from the browser's back/forward cache.
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) return;

        if (sessionStorage.getItem(COLOUR_RETURN_KEY) === '1' ||
            sessionStorage.getItem(COLOUR_ACTIVE_KEY) === '1') {
            initialTheme =
                sessionStorage.getItem(COLOUR_INITIAL_KEY) || initialTheme;

            clickCount = 2;
            currentTheme = 'colour';
        }

        sessionStorage.removeItem(COLOUR_RETURN_KEY);
        sessionStorage.removeItem(COLOUR_INITIAL_KEY);

        sessionStorage.setItem(COLOUR_ACTIVE_KEY, currentTheme === 'colour' ? '1' : '0');
        applyTheme();
    });

    window.getPortfolioThemeState = () => ({
        currentTheme,
        initialTheme
    });
}

function initSubpageNavigation() {
    let navigating = false;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    document.addEventListener('click', event => {
        const link = event.target.closest('a[href]');
        if (!link || event.defaultPrevented || event.button !== 0 ||
            event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
            link.hasAttribute('download') || (link.target && link.target !== '_self')) return;

        const destination = new URL(link.href, window.location.href);
        const isInternalSubpage = destination.origin === location.origin &&
            destination.pathname.endsWith('.html') &&
            destination.pathname !== location.pathname;
        if (!isInternalSubpage || navigating) return;

        const state = window.getPortfolioThemeState?.();
        if (state?.currentTheme === 'colour') {
            sessionStorage.setItem(COLOUR_RETURN_KEY, '1');
            sessionStorage.setItem(COLOUR_INITIAL_KEY, state.initialTheme);
        } else {
            sessionStorage.removeItem(COLOUR_RETURN_KEY);
            sessionStorage.removeItem(COLOUR_INITIAL_KEY);
        }

        sessionStorage.setItem('portfolio-navigation-pending', '1');
        if (reducedMotion.matches) return;
        event.preventDefault();
        navigating = true;
        document.documentElement.classList.add('homepage-departing');
        setTimeout(() => location.assign(destination.href), 320);
    });
}

function initTabs() {
    let activeSection = null;
    let transitionTimer = null;

    window.showSection = function (sectionId, options = {}) {
        const target = document.getElementById(sectionId);
        if (!target || !target.classList.contains('content-section')) return;

        const isInitial = activeSection === null;
        if (!isInitial && activeSection === sectionId && !options.force) return;

        if (transitionTimer) clearTimeout(transitionTimer);
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('tab-entering');
            section.classList.toggle('hidden', section !== target);
        });

        // Remove the early-render override only after the correct section is selected.
        document.documentElement.classList.remove('initial-posts');
        activeSection = sectionId;
        updateActiveNavStyles(sectionId);

        if (!isInitial && !options.instant) {
            // Restart the animation even after a quick tab switch.
            void target.offsetWidth;
            target.classList.add('tab-entering');
            transitionTimer = setTimeout(() => {
                target.classList.remove('tab-entering');
            }, 420);
        }

        if (!isInitial && !options.preserveScroll) window.scrollTo(0, 0);
    };

    function tabFromLocation() {
        const requested = new URLSearchParams(location.search).get('tab');
        return requested === 'posts' || location.hash === '#posts'
            ? 'posts' : 'about';
    }

    showSection(tabFromLocation(), { instant: true });

    // On browser back/forward, derive the tab from the *current* URL.
    window.addEventListener('pageshow', (event) => {
        showSection(tabFromLocation(), { force: true, instant: true, preserveScroll: true });
    });
}

function updateActiveNavStyles(activeId) {
    const navButtons = document.querySelectorAll(
        'nav button.nav-link'
    );

    navButtons.forEach(button => {
        const isMatch =
            button.textContent.trim().toLowerCase() ===
            activeId.toLowerCase();

        if (isMatch) {
            button.classList.add('text-zinc-900', 'dark:text-zinc-50');
            button.classList.remove(
                'text-zinc-600',
                'dark:text-zinc-400'
            );
        } else {
            button.classList.remove(
                'text-zinc-900',
                'dark:text-zinc-50'
            );
            button.classList.add(
                'text-zinc-600',
                'dark:text-zinc-400'
            );
        }
    });
}

const SKILLS = [
    {
        label: 'Actuator Theory',
        from: 'Biped_V1',
        href: 'projects/Biped_V1.html'
    },
    {
        label: 'System Modeling',
        from: 'Capstone',
        href: 'projects/Capstone.html'
    },
    {
        label: 'Linkage Kinematics',
        from: 'Capstone',
        href: 'projects/Capstone.html'
    },
    {
        label: 'Actuator Sizing',
        from: 'Capstone',
        href: 'projects/Capstone.html'
    },
    {
        label: 'Gearbox Selection',
        from: 'Wave_Actuator',
        href: 'projects/Wave_Actuator.html'
    },
    {
        label: 'Kinematic Decoupling',
        from: 'Robotic Hand',
        href: 'projects/Hand.html'
    },
    {
        label: 'Inverse Kinematics',
        from: 'Quadruped',
        href: 'projects/Quadruped.html'
    },
    {
        label: 'Gravity Compensation',
        from: 'Capstone',
        href: 'projects/Capstone.html'
    },
    {
        label: 'Capstan Drive',
        from: 'Biped_V1',
        href: 'projects/Biped_V1.html'
    },
    {
        label: 'Underactuated Dynamics',
        from: 'Robotic Hand',
        href: 'projects/Hand.html'
    },
    {
        label: 'Wave Drive',
        from: 'Wave_Actuator',
        href: 'projects/Wave_Actuator.html'
    },
    {
        label: 'Gait and Step Generation',
        from: 'Quadruped',
        href: 'projects/Quadruped.html'
    },
    {
        label: 'Belt + Pulley',
        from: 'Biped_V2',
        href: 'projects/Biped_V2.html'
    },
    {
        label: 'Product Design',
        from: 'Lamp',
        href: 'projects/Lamp.html'
    }
];

const PILL_CLASSES =
    'px-2.5 py-0.5 text-[11px] font-semibold bg-zinc-200/60 dark:bg-zinc-800/50 ' +
    'text-zinc-700 dark:text-zinc-300 rounded-full border border-zinc-300/30 dark:border-zinc-700/30 ' +
    'hover:bg-zinc-300/60 dark:hover:bg-zinc-700/50 hover:text-zinc-900 dark:hover:text-zinc-100 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ' +
    'transition-colors cursor-pointer';

function initSkills() {
    const container = document.getElementById('skills-index');

    if (!container) return;

    const tiles = new Map();

    document.querySelectorAll(
        '#projects-grid > a[href], #experiences-grid > a[href]'
    ).forEach(tile => {
        const page = tile.getAttribute('href');

        if (!tiles.has(page)) {
            tiles.set(page, tile);
        }
    });

    SKILLS.forEach(skill => {
        const page = skill.href.split('#')[0];
        const pill = document.createElement('a');

        pill.href = skill.href;
        pill.className = PILL_CLASSES;
        pill.textContent = skill.label;
        pill.title = skill.from;

        const tile = tiles.get(page);

        if (tile) {
            const on = () => tile.classList.add('tile-hl');
            const off = () => tile.classList.remove('tile-hl');

            pill.addEventListener('mouseenter', on);
            pill.addEventListener('mouseleave', off);
            pill.addEventListener('focus', on);
            pill.addEventListener('blur', off);
        }

        container.appendChild(pill);
    });
}

function initPlayfulTiles() {
    // Independent colour sequences for Projects and Experiences.
    const grids = [
        {
            selector: '#projects-grid > a',
            scatterSeed: 0.5,
            colours: [
                '#EAA7C7', // Pink
                '#EAC119', // Yellow
                '#808BC5', // Lavender
                '#C63F3E', // Red
                '#3B5284', // Navy
                '#94B447', // Green
                '#9ED6DF'  // Cyan
            ]
        },
        {
            selector: '#experiences-grid > a',
            scatterSeed: 3.8,
            colours: [
                '#9ED6DF', // Cyan
                '#94B447', // Green
                '#EAA7C7', // Pink
                '#808BC5', // Lavender
                '#EAC119', // Yellow
                '#3B5284', // Navy
                '#C63F3E'  // Red
            ]
        }
    ];

    grids.forEach(({ selector, colours, scatterSeed }) => {
        const tiles = document.querySelectorAll(selector);

        tiles.forEach((tile, index) => {
            // Assign the corresponding colour.
            const colour = colours[index % colours.length];

            tile.style.setProperty('--playful-color', colour);

            // Consistent scatter positions.
            const angle = Math.sin(index * 2.37 + scatterSeed) * 5;
            const offsetX = Math.sin(index * 3.13 + scatterSeed + 0.6) * 9;
            const offsetY = Math.cos(index * 2.73 + scatterSeed + 0.2) * 9;

            tile.style.setProperty(
                '--scatter-angle',
                `${angle.toFixed(2)}deg`
            );

            tile.style.setProperty(
                '--scatter-x',
                `${offsetX.toFixed(1)}px`
            );

            tile.style.setProperty(
                '--scatter-y',
                `${offsetY.toFixed(1)}px`
            );

            // Individual floating animation timing.
            const bobDuration = 4.2 + ((index + Math.round(scatterSeed)) % 5) * 0.65;
            const bobDelay = -(index + scatterSeed) * 0.73;

            tile.style.setProperty(
                '--bob-duration',
                `${bobDuration.toFixed(2)}s`
            );

            tile.style.setProperty(
                '--bob-delay',
                `${bobDelay.toFixed(2)}s`
            );

            // Wrap tile content so floating and scatter animations
            // can operate independently.
            if (!tile.querySelector('.playful-inner')) {
                const inner = document.createElement('div');

                inner.className =
                    'playful-inner flex flex-col justify-between h-full';

                while (tile.firstChild) {
                    inner.appendChild(tile.firstChild);
                }

                tile.appendChild(inner);
            }
        });
    });
}

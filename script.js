// Initialize all modules once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    initSkills();
});

/**
 * 1. THEME PERSISTENCE MANAGEMENT
 */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('theme-toggle-moon');
    const sunIcon = document.getElementById('theme-toggle-sun');

    if (!themeToggleBtn) return;

    function updateIcons(isDark) {
        if (isDark) {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
    }

    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);

    if (shouldBeDark) {
        document.documentElement.classList.add('dark');
        updateIcons(true);
    } else {
        document.documentElement.classList.remove('dark');
        updateIcons(false);
    }

    themeToggleBtn.addEventListener('click', () => {
        const isDarkNow = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
        updateIcons(isDarkNow);
    });
}

/**
 * 2. PORTFOLIO TABS NAVIGATION MANAGEMENT
 */
function initTabs() {
    window.showSection = function(sectionId) {
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(sec => sec.classList.add('hidden'));

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        window.scrollTo({ top: 0, behavior: 'instant' });
        updateActiveNavStyles(sectionId);
    };
}

function updateActiveNavStyles(activeId) {
    const navButtons = document.querySelectorAll('nav button.nav-link');
    
    navButtons.forEach(btn => {
        const isMatch = btn.textContent.trim().toLowerCase() === activeId.toLowerCase();
        
        if (isMatch) {
            btn.classList.add('text-zinc-900', 'dark:text-zinc-50');
            btn.classList.remove('text-zinc-600', 'dark:text-zinc-400');
        } else {
            btn.classList.remove('text-zinc-900', 'dark:text-zinc-50');
            btn.classList.add('text-zinc-600', 'dark:text-zinc-400');
        }
    });
}

/**
 * 3. SKILLS INDEX
 */
const SKILLS = [
    { label: 'Mechanical Design', from: 'Quadruped',    href: 'projects/Quadruped.html' },

    { label: 'Kinematic Decoupling',   from: 'Robotic Hand', href: 'projects/Hand.html' },

    { label: 'Inverse Kinematics', from: 'Quadruped',   href: 'projects/Quadruped.html' },

    { label: 'Cable-Driven Actuation', from: 'Robotic Hand', href: 'projects/Hand.html' },

    { label: 'Underactuated Dynamics', from: 'Robotic Hand', href: 'projects/Hand.html' },

    { label: 'Gait and Step Generation', from: 'Quadruped', href: 'projects/Quadruped.html' },

    { label: 'Product Design',         from: 'Lamp',    href: 'projects/Lamp.html' },

    // { label: 'User Research',          from: 'Lamp',    href: 'projects/Lamp.html' },
    // { label: 'Ergonomics',             from: 'Lamp',    href: 'projects/Lamp.html' },

    // { label: '...', from: 'Biped V2',          href: 'projects/Biped_V2.html#...' },
    // { label: '...', from: 'Wave Actuator',     href: 'projects/Wave_Actuator.html#...' },
    // { label: '...', from: 'Biped V1',          href: 'projects/Biped_V1.html#...' },
    // { label: '...', from: 'Humanoid',          href: 'experiences/Humanoid.html#...' },
    // { label: '...', from: 'Proception AI',     href: 'experiences/Proception_AI.html#...' },
    // { label: '...', from: 'Tesla',             href: 'experiences/Tesla.html#...' },
    // { label: '...', from: 'Mycro Harvest',     href: 'experiences/Mycro_Harvest.html#...' },
    // { label: '...', from: 'Sanctuary AI',      href: 'experiences/Sanctuary_AI.html#...' },
    // { label: '...', from: 'Neurocage Systems', href: 'experiences/Neurocage_Systems.html#...' },
];

const PILL_CLASSES = 'px-2.5 py-0.5 text-[11px] font-semibold bg-zinc-200/60 dark:bg-zinc-800/50 ' +
    'text-zinc-700 dark:text-zinc-300 rounded-full border border-zinc-300/30 dark:border-zinc-700/30 ' +
    'hover:bg-zinc-300/60 dark:hover:bg-zinc-700/50 hover:text-zinc-900 dark:hover:text-zinc-100 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100 ' +
    'transition-colors cursor-pointer';

function initSkills() {
    const container = document.getElementById('skills-index');
    if (!container) return;

    const tiles = new Map();
    document.querySelectorAll('#projects-grid > a[href], #experiences-grid > a[href]')
        .forEach(tile => {
            const page = tile.getAttribute('href');
            if (!tiles.has(page)) tiles.set(page, tile);
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
            const on  = () => tile.classList.add('tile-hl');
            const off = () => tile.classList.remove('tile-hl');
            pill.addEventListener('mouseenter', on);
            pill.addEventListener('mouseleave', off);
            pill.addEventListener('focus', on);
            pill.addEventListener('blur', off);
        }

        container.appendChild(pill);
    });
}
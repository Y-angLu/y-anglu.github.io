// Initialize all modules once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    initHorizontalScroll();
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
 * 3. HORIZONTAL SCROLL MANAGEMENT (Experiences)
 */
function initHorizontalScroll() {
    const slider = document.getElementById('experiences-scroll');
    const btnLeft = document.getElementById('scroll-left');
    const btnRight = document.getElementById('scroll-right');

    if (!slider) return;

    // --- Click to Scroll ---
    const scrollAmount = 280; 

    btnLeft?.addEventListener('click', () => {
        slider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    btnRight?.addEventListener('click', () => {
        slider.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });

    const handleScrollState = () => {
        if (btnLeft) btnLeft.disabled = slider.scrollLeft <= 0;
        if (btnRight) btnRight.disabled = slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 1;
    };
    
    slider.addEventListener('scroll', handleScrollState);
    window.addEventListener('resize', handleScrollState);
    handleScrollState();

    // --- Drag to Scroll ---
    let isDown = false;
    let startX;
    let scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.remove('snap-x', 'snap-mandatory', 'scroll-smooth');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.add('snap-x', 'snap-mandatory', 'scroll-smooth');
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.add('snap-x', 'snap-mandatory', 'scroll-smooth');
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2; 
        slider.scrollLeft = scrollLeft - walk;
    });
}
// Execute immediately to set up the theme toggle and tab navigation
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
});

/**
 * 1. THEME PERSISTENCE MANAGEMENT
 */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('theme-toggle-moon');
    const sunIcon = document.getElementById('theme-toggle-sun');

    if (!themeToggleBtn) return;

    // Helper to update visual icon states based on current HTML element layout class
    function updateIcons(isDark) {
        if (isDark) {
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }
    }

    // Check localStorage or fallback to preferred system browser defaults
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

    // Toggle logic on click
    themeToggleBtn.addEventListener('click', () => {
        const isDarkNow = document.documentElement.classList.toggle('dark');
        
        // Save state to local browser memory for reference by the template pages
        localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
        updateIcons(isDarkNow);
    });
}

/**
 * 2. PORTFOLIO TABS NAVIGATION MANAGEMENT
 */
function initTabs() {
    // Expose the showSection function to window scope so onclick handlers work inline
    window.showSection = function(sectionId) {
        // Hide all major section layout blocks
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(sec => sec.classList.add('hidden'));

        // Target and reveal the chosen clicked view container
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Keep page scrolling positioned cleanly at top on layout swap
        window.scrollTo({ top: 0, behavior: 'instant' });

        // Update navigation link underlines/colors dynamically
        updateActiveNavStyles(sectionId);
    };
}

function updateActiveNavStyles(activeId) {
    const navButtons = document.querySelectorAll('nav button.nav-link');
    
    navButtons.forEach(btn => {
        // Normalizes string match clean up
        const isMatch = btn.textContent.trim().toLowerCase() === activeId.toLowerCase();
        
        if (isMatch) {
            // Explicitly set both light and dark active colors without hitting token mapping bugs
            btn.classList.add('text-zinc-900', 'dark:text-zinc-50');
            btn.classList.remove('text-zinc-600');
        } else {
            btn.classList.remove('text-zinc-900', 'dark:text-zinc-50');
            btn.classList.add('text-zinc-600');
        }
    });
}
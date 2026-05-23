// Function to handle switching between tabs instantly
function showSection(sectionId) {
    // Hide all major views
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });

    // Reveal the target view (either 'about' or 'posts')
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }

    // --- Update Nav Link Highlights for Dark Mode ---
    const isDark = document.documentElement.classList.contains('dark');
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        // Reset all links to their muted grey state
        link.classList.remove('text-zinc-900', 'text-zinc-100');
        link.classList.add('text-zinc-600', 'dark:text-zinc-400');
    });

    // Apply the correct active color to the current tab button
    const clickedButton = Array.from(navLinks).find(btn => 
        btn.getAttribute('onclick')?.includes(`'${sectionId}'`)
    );
    if (clickedButton) {
        clickedButton.classList.remove('text-zinc-600', 'dark:text-zinc-400');
        // If the site is dark, highlight in white; if light, highlight in dark grey
        clickedButton.classList.add(isDark ? 'text-zinc-100' : 'text-zinc-900');
    }
    // -----------------------------------------------------

    // Reset window scroll position smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- Light / Dark Mode Core Functionality ---
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const moonIcon = document.getElementById('theme-toggle-moon');
    const sunIcon = document.getElementById('theme-toggle-sun');

    if (!themeToggleBtn || !moonIcon || !sunIcon) return;

    // Determine target mode: checked from explicit localStorage state or system dark preferences fallback
    const isDarkSaved = localStorage.getItem('color-theme') === 'dark';
    const isSystemDark = !('color-theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (isDarkSaved || isSystemDark) {
        document.documentElement.classList.add('dark');
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
    }

    // Handle Button Interactions
    themeToggleBtn.addEventListener('click', () => {
        const isCurrentDark = document.documentElement.classList.contains('dark');
        
        if (isCurrentDark) {
            // Swap to Light Mode
            document.documentElement.classList.remove('dark');
            localStorage.setItem('color-theme', 'light');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            // Swap to Dark Mode
            document.documentElement.classList.add('dark');
            localStorage.setItem('color-theme', 'dark');
            moonIcon.classList.add('hidden');
            sunIcon.classList.remove('hidden');
        }

        // Re-trigger active section formatting to ensure highlighted text links switch shades correctly
        const activeSection = Array.from(document.querySelectorAll('.content-section')).find(s => !s.classList.contains('hidden'));
        if (activeSection) {
            showSection(activeSection.id);
        }
    });
}

// Default initialization to 'about' section and loading layout theme triggers on DOM load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    showSection('about');
});
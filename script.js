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

    // Reset window scroll position smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Default initialization to 'about' section on page load
document.addEventListener('DOMContentLoaded', () => {
    showSection('about');
});
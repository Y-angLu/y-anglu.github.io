// Function to handle switching between tabs instantly
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });

    // Show the active section
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.remove('hidden');
    }

    // Scroll back to top smoothly on section change
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Ensure the page loads on the 'about' section by default
document.addEventListener('DOMContentLoaded', () => {
    showSection('about');
});
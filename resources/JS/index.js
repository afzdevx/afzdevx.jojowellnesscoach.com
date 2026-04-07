// Dynamic copyright year
document.getElementById('yr').textContent = new Date().getFullYear();

// ── Hamburger / mobile nav toggle ──────────────────────────
var hamburger = document.getElementById('hamburger');
var mobileNav  = document.getElementById('mobileNav');

hamburger.addEventListener('click', function() {
    var isOpen = mobileNav.classList.toggle('is-open');
    hamburger.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
});

function closeNav() {
    mobileNav.classList.remove('is-open');
    hamburger.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

// Close drawer when tapping outside of it
document.addEventListener('click', function(e) {
    if (
        mobileNav.classList.contains('is-open') &&
        !mobileNav.contains(e.target) &&
        !hamburger.contains(e.target)
    ) {
        closeNav();
    }
});

// ── Navbar scroll shadow ───────────────────────────────────
var navbar = document.getElementById('navbar');
window.addEventListener('scroll', function() {
    navbar.style.boxShadow = window.scrollY > 24
        ? '0 4px 28px rgba(0,0,0,0.55)'
        : 'none';
}, { passive: true });

/**
 * GlobalGuard Exports - Main JavaScript
 * Handles navigation, animations, and interactive features
 */

(function() {
    'use strict';

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================

    /**
     * Throttle function to limit how often a function can be called
     */
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Debounce function to delay function execution
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ============================================
    // NAVBAR FUNCTIONALITY
    // ============================================

    const navbar = document.querySelector('.navbar');
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    /**
     * Toggle mobile menu
     */
    function toggleMobileMenu() {
        const isActive = navMenu.classList.contains('active');
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', !isActive);
        
        // Prevent body scroll when menu is open
        if (!isActive) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    /**
     * Close mobile menu
     */
    function closeMobileMenu() {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    // Event listeners for mobile menu
    if (hamburger) {
        hamburger.addEventListener('click', toggleMobileMenu);
    }

    // Close menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('active') && 
            !navMenu.contains(e.target) && 
            !hamburger.contains(e.target)) {
            closeMobileMenu();
        }
    });

    /**
     * Handle navbar scroll effect
     */
    function handleNavbarScroll() {
        const scrollY = window.pageYOffset;
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    // Throttled scroll handler for better performance
    window.addEventListener('scroll', throttle(handleNavbarScroll, 100));

    // ============================================
    // SMOOTH SCROLLING
    // ============================================

    /**
     * Smooth scroll to target element
     */
    function smoothScrollTo(target) {
        if (!target) return;
        
        const offsetTop = target.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    }

    // Smooth scrolling for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#contact') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                smoothScrollTo(target);
            }
        });
    });

    // ============================================
    // INTERSECTION OBSERVER FOR ANIMATIONS
    // ============================================

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after animation to improve performance
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    /**
     * Initialize scroll animations
     */
    function initScrollAnimations() {
        const serviceCards = document.querySelectorAll('.service-card');
        const aboutTexts = document.querySelectorAll('.about-text');
        
        // Observe service cards with staggered delay
        serviceCards.forEach((card, index) => {
            observer.observe(card);
        });
        
        // Observe about texts
        aboutTexts.forEach((text) => {
            observer.observe(text);
        });
    }

    // ============================================
    // ACTIVE NAVIGATION LINK HIGHLIGHTING
    // ============================================

    const sections = document.querySelectorAll('section[id]');

    /**
     * Update active navigation link based on scroll position
     */
    function updateActiveNavLink() {
        const scrollY = window.pageYOffset + 100;

        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // Throttled scroll handler for active link highlighting
    window.addEventListener('scroll', throttle(updateActiveNavLink, 150));

    // ============================================
    // BUTTON INTERACTIONS
    // ============================================

    /**
     * Add ripple effect to buttons
     */
    function createRipple(e, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    /**
     * Initialize button handlers
     */
    function initButtonHandlers() {
        // Primary buttons (Get Started, Start Hedging)
        document.querySelectorAll('.btn-primary, .btn-get-started').forEach(button => {
            button.addEventListener('click', function(e) {
                createRipple(e, this);
                // Add your action here (e.g., redirect to signup page)
                console.log('Primary action triggered');
                // Example: window.location.href = 'signup.html';
            });
        });

        // Secondary buttons (Explore Services)
        document.querySelectorAll('.btn-secondary').forEach(button => {
            button.addEventListener('click', function(e) {
                createRipple(e, this);
                const servicesSection = document.getElementById('services');
                if (servicesSection) {
                    smoothScrollTo(servicesSection);
                }
            });
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize all functionality when DOM is ready
     */
    function init() {
        initScrollAnimations();
        initButtonHandlers();
        handleNavbarScroll(); // Check initial scroll position
        updateActiveNavLink(); // Set initial active link
    }

    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============================================
    // KEYBOARD NAVIGATION SUPPORT
    // ============================================

    // Close mobile menu on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            closeMobileMenu();
        }
    });

    // ============================================
    // PERFORMANCE OPTIMIZATIONS
    // ============================================

    // Preload critical resources
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // Any non-critical initialization can go here
        });
    }

})();

// ============================================
// FIREBASE AUTHENTICATION
// ============================================

// Firebase Configuration
// NOTE: Replace these with your actual Firebase config values
const firebaseConfig = {
    apiKey: "AIzaSyDiQ-R5oJ124N3fhm9Nhs7sC5yJZQM43Ts",
  authDomain: "expoter-af015.firebaseapp.com",
  projectId: "expoter-af015",
  storageBucket: "expoter-af015.firebasestorage.app",
  messagingSenderId: "1094581941288",
  appId: "1:1094581941288:web:43f872395cf17eafd1311d",
  measurementId: "G-GSYX71VGVF"
};

// Initialize Firebase
let firebaseApp, auth;
try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
} catch (error) {
    console.warn('Firebase initialization error. Please configure Firebase credentials:', error);
}

// ============================================
// AUTH MODAL FUNCTIONALITY
// ============================================

let otpConfirmationResult = null;
let otpSent = false;

/**
 * Open authentication modal
 */
function openAuthModal(tab = 'login') {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Switch to specified tab
    switchAuthTab(tab);
    
    // Focus management
    setTimeout(() => {
        const firstInput = modal.querySelector('input');
        if (firstInput) firstInput.focus();
    }, 300);
}

/**
 * Close authentication modal
 */
function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Reset forms
    resetAuthForms();
}

/**
 * Switch between login and signup tabs
 */
function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginTab = document.querySelector('[data-tab="login"]');
    const signupTab = document.querySelector('[data-tab="signup"]');
    
    if (tab === 'login') {
        loginForm?.classList.add('active');
        signupForm?.classList.remove('active');
        loginTab?.classList.add('active');
        signupTab?.classList.remove('active');
    } else {
        signupForm?.classList.add('active');
        loginForm?.classList.remove('active');
        signupTab?.classList.add('active');
        loginTab?.classList.remove('active');
    }
    
    // Reset forms when switching
    resetAuthForms();
}

/**
 * Switch between email and OTP login methods
 */
function switchLoginMethod(method) {
    const emailForm = document.getElementById('emailLoginForm');
    const otpForm = document.getElementById('otpLoginForm');
    const emailBtn = document.querySelector('[data-method="email"]');
    const otpBtn = document.querySelector('[data-method="otp"]');
    
    if (method === 'email') {
        emailForm?.classList.add('active');
        otpForm?.classList.remove('active');
        emailBtn?.classList.add('active');
        otpBtn?.classList.remove('active');
    } else {
        otpForm?.classList.add('active');
        emailForm?.classList.remove('active');
        otpBtn?.classList.add('active');
        emailBtn?.classList.remove('active');
    }
    
    // Reset OTP form
    otpSent = false;
    const otpCodeGroup = document.getElementById('otpCodeGroup');
    const otpBtnText = document.getElementById('otpBtnText');
    if (otpCodeGroup) otpCodeGroup.style.display = 'none';
    if (otpBtnText) otpBtnText.textContent = 'Send OTP';
}

/**
 * Toggle password visibility
 */
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const toggle = input?.parentElement.querySelector('.password-toggle');
    if (!input || !toggle) return;
    
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    
    // Update icon (you can enhance this with different icons)
    const svg = toggle.querySelector('svg');
    if (svg) {
        if (type === 'text') {
            svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
        } else {
            svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
        }
    }
}

/**
 * Check password strength
 */
function checkPasswordStrength(password) {
    const strengthIndicator = document.getElementById('passwordStrength');
    if (!strengthIndicator) return;
    
    if (!password) {
        strengthIndicator.className = 'password-strength';
        return;
    }
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/\d/)) strength++;
    if (password.match(/[^a-zA-Z\d]/)) strength++;
    
    strengthIndicator.className = 'password-strength';
    if (strength <= 2) {
        strengthIndicator.classList.add('weak');
    } else if (strength === 3) {
        strengthIndicator.classList.add('medium');
    } else {
        strengthIndicator.classList.add('strong');
    }
}

// Add password strength checker to signup password field
document.addEventListener('DOMContentLoaded', () => {
    const signupPassword = document.getElementById('signupPassword');
    if (signupPassword) {
        signupPassword.addEventListener('input', (e) => {
            checkPasswordStrength(e.target.value);
        });
    }
});

/**
 * Show auth message
 */
function showAuthMessage(message, type = 'info') {
    const messageEl = document.getElementById('authMessage');
    if (!messageEl) return;
    
    messageEl.textContent = message;
    messageEl.className = `auth-message ${type} show`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 5000);
}

/**
 * Reset all auth forms
 */
function resetAuthForms() {
    // Reset login form
    const emailLoginForm = document.getElementById('emailLoginFormElement');
    const otpLoginForm = document.getElementById('otpLoginFormElement');
    if (emailLoginForm) emailLoginForm.reset();
    if (otpLoginForm) otpLoginForm.reset();
    
    // Reset signup form
    const signupForm = document.getElementById('signupFormElement');
    if (signupForm) signupForm.reset();
    
    // Reset OTP state
    otpSent = false;
    otpConfirmationResult = null;
    const otpCodeGroup = document.getElementById('otpCodeGroup');
    const otpBtnText = document.getElementById('otpBtnText');
    if (otpCodeGroup) otpCodeGroup.style.display = 'none';
    if (otpBtnText) otpBtnText.textContent = 'Send OTP';
    
    // Reset password strength
    const passwordStrength = document.getElementById('passwordStrength');
    if (passwordStrength) passwordStrength.className = 'password-strength';
    
    // Clear messages
    const messageEl = document.getElementById('authMessage');
    if (messageEl) {
        messageEl.classList.remove('show');
        messageEl.textContent = '';
    }
}

/**
 * Set button loading state
 */
function setButtonLoading(buttonId, loading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// ============================================
// FIREBASE AUTHENTICATION HANDLERS
// ============================================

/**
 * Handle email/password login
 */
async function handleEmailLogin(event) {
    event.preventDefault();
    
    if (!auth) {
        showAuthMessage('Firebase is not configured. Please add your Firebase credentials.', 'error');
        return;
    }
    
    const form = event.target;
    const email = form.email.value.trim();
    const password = form.password.value;
    const button = document.getElementById('emailLoginBtn');
    
    setButtonLoading('emailLoginBtn', true);
    showAuthMessage('', 'info');
    
    try {
        // Check if input is email or username
        let emailToUse = email;
        if (!email.includes('@')) {
            // If it's a username, you might want to look it up in Firestore
            // For now, we'll treat it as an email or show an error
            showAuthMessage('Please use your email address to login', 'error');
            setButtonLoading('emailLoginBtn', false);
            return;
        }
        
        const userCredential = await auth.signInWithEmailAndPassword(emailToUse, password);
        showAuthMessage('Login successful! Redirecting...', 'success');
        
        // Store user data if needed
        const user = userCredential.user;
        console.log('User logged in:', user);
        
        // Redirect or update UI
        setTimeout(() => {
            closeAuthModal();
            window.location.href = 'Export-Dashboard/export-dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. Please try again.';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
        }
        
        showAuthMessage(errorMessage, 'error');
    } finally {
        setButtonLoading('emailLoginBtn', false);
    }
}

/**
 * Handle OTP login
 */
async function handleOTPLogin(event) {
    event.preventDefault();
    
    if (!auth) {
        showAuthMessage('Firebase is not configured. Please add your Firebase credentials.', 'error');
        return;
    }
    
    const form = event.target;
    const emailOrPhone = form.otpEmail.value.trim();
    const otpCode = form.otpCode?.value.trim();
    const button = document.getElementById('otpLoginBtn');
    const otpCodeGroup = document.getElementById('otpCodeGroup');
    const otpBtnText = document.getElementById('otpBtnText');
    
    setButtonLoading('otpLoginBtn', true);
    showAuthMessage('', 'info');
    
    try {
        if (!otpSent) {
            // Send OTP
            const recaptchaVerifier = new firebase.auth.RecaptchaVerifier('otpLoginBtn', {
                'size': 'invisible',
                'callback': () => {
                    // reCAPTCHA solved
                }
            });
            
            // Check if email or phone
            if (emailOrPhone.includes('@')) {
                // Email OTP
                const actionCodeSettings = {
                    url: window.location.href,
                    handleCodeInApp: true,
                };
                
                await auth.sendSignInLinkToEmail(emailOrPhone, actionCodeSettings);
                showAuthMessage('Sign-in link sent to your email!', 'success');
            } else {
                // Phone OTP
                const phoneNumber = emailOrPhone.startsWith('+') ? emailOrPhone : `+${emailOrPhone}`;
                otpConfirmationResult = await auth.signInWithPhoneNumber(phoneNumber, recaptchaVerifier);
                
                otpSent = true;
                if (otpCodeGroup) otpCodeGroup.style.display = 'block';
                if (otpBtnText) otpBtnText.textContent = 'Verify OTP';
                showAuthMessage('OTP sent to your phone!', 'success');
            }
        } else {
            // Verify OTP
            if (!otpCode || otpCode.length !== 6) {
                showAuthMessage('Please enter the 6-digit OTP', 'error');
                setButtonLoading('otpLoginBtn', false);
                return;
            }
            
            if (otpConfirmationResult) {
                const userCredential = await otpConfirmationResult.confirm(otpCode);
                showAuthMessage('Login successful! Redirecting...', 'success');
                
                const user = userCredential.user;
                console.log('User logged in:', user);
                
                setTimeout(() => {
                    closeAuthModal();
                    window.location.href = 'Export-Dashboard/export-dashboard.html';
                }, 1500);
            }
        }
    } catch (error) {
        console.error('OTP login error:', error);
        let errorMessage = 'OTP verification failed. Please try again.';
        
        switch (error.code) {
            case 'auth/invalid-phone-number':
                errorMessage = 'Invalid phone number format.';
                break;
            case 'auth/invalid-verification-code':
                errorMessage = 'Invalid OTP code. Please try again.';
                break;
            case 'auth/code-expired':
                errorMessage = 'OTP code has expired. Please request a new one.';
                break;
        }
        
        showAuthMessage(errorMessage, 'error');
        otpSent = false;
        if (otpCodeGroup) otpCodeGroup.style.display = 'none';
        if (otpBtnText) otpBtnText.textContent = 'Send OTP';
    } finally {
        setButtonLoading('otpLoginBtn', false);
    }
}

/**
 * Handle signup
 */
async function handleSignup(event) {
    event.preventDefault();
    
    if (!auth) {
        showAuthMessage('Firebase is not configured. Please add your Firebase credentials.', 'error');
        return;
    }
    
    const form = event.target;
    const name = form.name.value.trim();
    const company = form.company.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const country = form.country.value;
    const address = form.address.value.trim();
    
    setButtonLoading('signupBtn', true);
    showAuthMessage('', 'info');
    
    try {
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile
        await user.updateProfile({
            displayName: name
        });
        
        // Store additional user data in Firestore (if you have Firestore set up)
        // You would need to add Firestore SDK and initialize it
        // For now, we'll just log it
        const userData = {
            uid: user.uid,
            name: name,
            company: company,
            email: email,
            country: country,
            address: address,
            createdAt: new Date().toISOString()
        };
        
        console.log('User data to store:', userData);
        // TODO: Save to Firestore
        // await firestore.collection('users').doc(user.uid).set(userData);
        
        showAuthMessage('Account created successfully! Redirecting...', 'success');
        
        // Send email verification (optional)
        await user.sendEmailVerification();
        
        setTimeout(() => {
            closeAuthModal();
            window.location.href = 'Export-Dashboard/export-dashboard.html';
        }, 1500);
        
    } catch (error) {
        console.error('Signup error:', error);
        let errorMessage = 'Signup failed. Please try again.';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered. Please login instead.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please use a stronger password.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled.';
                break;
        }
        
        showAuthMessage(errorMessage, 'error');
    } finally {
        setButtonLoading('signupBtn', false);
    }
}

/**
 * Handle forgot password
 */
async function handleForgotPassword(event) {
    event.preventDefault();
    
    if (!auth) {
        showAuthMessage('Firebase is not configured. Please add your Firebase credentials.', 'error');
        return;
    }
    
    const email = document.getElementById('loginEmail').value.trim();
    
    if (!email || !email.includes('@')) {
        showAuthMessage('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        await auth.sendPasswordResetEmail(email);
        showAuthMessage('Password reset email sent! Please check your inbox.', 'success');
    } catch (error) {
        console.error('Password reset error:', error);
        let errorMessage = 'Failed to send reset email. Please try again.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        }
        
        showAuthMessage(errorMessage, 'error');
    }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('authModal');
        if (modal && modal.classList.contains('active')) {
            closeAuthModal();
        }
    }
});

// Prevent modal from closing when clicking inside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('authModal');
    const container = document.querySelector('.auth-modal-container');
    
    if (modal && modal.classList.contains('active')) {
        if (e.target === modal || e.target.classList.contains('auth-modal-overlay')) {
            closeAuthModal();
        }
    }
});
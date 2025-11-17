/**
 * Export Dashboard - JavaScript
 * Handles dashboard functionality, Firebase integration, and profile management
 * 
 * FILE UPLOAD SYSTEM:
 * - All images and documents are converted to Base64 strings
 * - Base64 strings are stored directly in Firebase Realtime Database
 * - Images are automatically compressed (max 800x800, JPEG quality 0.7)
 * - Profile photos: users/{uid}/profilePhoto
 * - Documents: users/{uid}/documents/{docType}
 * 
 * NO FIREBASE STORAGE REQUIRED - All files stored as Base64 in Realtime Database
 */

// ============================================
// FIREBASE CONFIGURATION
// ============================================

const firebaseConfig = {
    apiKey: "AIzaSyDiQ-R5oJ124N3fhm9Nhs7sC5yJZQM43Ts",
    authDomain: "expoter-af015.firebaseapp.com",
    projectId: "expoter-af015",
    storageBucket: "expoter-af015.appspot.com",
    messagingSenderId: "1094581941288",
    appId: "1:1094581941288:web:43f872395cf17eafd1311d",
    measurementId: "G-GSYX71VGVF",
    // Realtime Database URL - Get this from Firebase Console > Realtime Database
    // Format: https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/
    databaseURL: "https://expoter-af015-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
let firebaseApp, auth, database, firestore;
try {
    // Check if Firebase is already initialized (compat mode)
    try {
        firebaseApp = firebase.app();
    } catch (e) {
        // Firebase not initialized, initialize it
        firebaseApp = firebase.initializeApp(firebaseConfig);
    }
    
    auth = firebase.auth();
    database = firebase.database();
    firestore = firebase.firestore();
    
    console.log('Firebase initialized successfully with Realtime Database and Firestore');
} catch (error) {
    console.error('Firebase initialization error:', error);
    console.error('Error details:', error.message, error.code);
    console.warn('Note: Make sure Realtime Database and Firestore are enabled in Firebase Console');
}

// ============================================
// AUTHENTICATION CHECK
// ============================================

// Check if user is authenticated
auth?.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        loadUserData(user);
        updateProfileDisplay(user);
    } else {
        // User is not signed in, redirect to login
        window.location.href = '../index.html';
    }
});

// ============================================
// DASHBOARD INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
    initializeSidebar();
    initializeNavigation();
    loadUserProfileData();
    checkEKYCStatus();
});

/**
 * Initialize dashboard
 */
function initializeDashboard() {
    // Set active tab from URL hash or default to dashboard
    const hash = window.location.hash.substring(1) || 'dashboard';
    switchTab(hash);
}

/**
 * Initialize sidebar
 */
function initializeSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar?.classList.toggle('active');
        });
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar?.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 968) {
            if (sidebar?.classList.contains('active') && 
                !sidebar.contains(e.target) && 
                !mobileMenuToggle?.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}

/**
 * Initialize navigation
 */
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-tab]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = link.getAttribute('data-tab');
            switchTab(tab);
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close sidebar on mobile
            if (window.innerWidth <= 968) {
                const sidebar = document.getElementById('sidebar');
                sidebar?.classList.remove('active');
            }
        });
    });
}

/**
 * Switch between dashboard tabs
 */
function switchTab(tabName) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    // Show selected section
    const targetSection = document.getElementById(`${tabName}Section`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const titles = {
            dashboard: 'Dashboard',
            contracts: 'Forward Contracts',
            insurance: 'Insurance',
            shipments: 'Shipments',
            payments: 'Payments',
            documents: 'Documents',
            analytics: 'Analytics',
            support: 'Support'
        };
        pageTitle.textContent = titles[tabName] || 'Dashboard';
    }

    // Update URL hash
    window.location.hash = tabName;
}

// ============================================
// PROFILE MODAL
// ============================================

/**
 * Open profile modal
 */
function openProfileModal() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Load user data into forms
    loadUserProfileData();
}

/**
 * Close profile modal
 */
function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

/**
 * Switch between profile tabs
 */
function switchProfileTab(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.profile-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Update tab active state
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-section') === sectionName) {
            tab.classList.add('active');
        }
    });
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('profileModal');
        if (modal && modal.classList.contains('active')) {
            closeProfileModal();
        }
    }
});

// ============================================
// USER DATA MANAGEMENT
// ============================================

/**
 * Load user data and update display
 */
function loadUserData(user) {
    if (!user) return;
    
    // Update welcome name
    const welcomeName = document.getElementById('welcomeName');
    if (welcomeName) {
        welcomeName.textContent = user.displayName || user.email?.split('@')[0] || 'Exporter';
    }
    
    // Update profile display
    updateProfileDisplay(user);
}

/**
 * Update profile display in header
 */
function updateProfileDisplay(user) {
    const profileName = document.getElementById('profileName');
    const profileAvatar = document.getElementById('profileAvatar');
    const avatarInitials = document.getElementById('avatarInitials');
    
    if (profileName) {
        profileName.textContent = user.displayName || user.email?.split('@')[0] || 'User';
    }
    
    if (avatarInitials) {
        const name = user.displayName || user.email || 'U';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        avatarInitials.textContent = initials;
    }
    
    // Load profile photo if available
    loadUserProfileData().then(() => {
        // Profile photo will be loaded from Realtime Database
    });
}

/**
 * Load user profile data from Realtime Database
 */
async function loadUserProfileData() {
    const user = auth?.currentUser;
    if (!user || !database) return;

    try {
        const userRef = database.ref(`users/${user.uid}`);
        const snapshot = await userRef.once('value');
        
        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            // Populate Basic Information
            if (userData.fullName) document.getElementById('fullName').value = userData.fullName;
            if (userData.email) document.getElementById('email').value = userData.email;
            if (userData.phoneNumber) document.getElementById('phoneNumber').value = userData.phoneNumber;
            if (userData.alternatePhone) document.getElementById('alternatePhone').value = userData.alternatePhone;
            if (userData.profilePhoto) {
                const photoPreview = document.getElementById('photoPreviewImg');
                const photoPreviewText = document.getElementById('photoPreviewText');
                if (photoPreview) {
                    // Profile photo is now stored as Base64 string
                    photoPreview.src = userData.profilePhoto;
                    photoPreview.style.display = 'block';
                    if (photoPreviewText) {
                        photoPreviewText.style.display = 'none';
                    }
                }
                
                // Update avatar in header
                const profileAvatar = document.getElementById('profileAvatar');
                const avatarInitials = document.getElementById('avatarInitials');
                if (profileAvatar) {
                    profileAvatar.style.backgroundImage = `url(${userData.profilePhoto})`;
                    profileAvatar.style.backgroundSize = 'cover';
                    profileAvatar.style.backgroundPosition = 'center';
                    if (avatarInitials) {
                        avatarInitials.style.display = 'none';
                    }
                }
            }
            
            // Populate Business Details
            if (userData.companyName) document.getElementById('companyName').value = userData.companyName;
            if (userData.businessType) document.getElementById('businessType').value = userData.businessType;
            if (userData.yearEstablished) document.getElementById('yearEstablished').value = userData.yearEstablished;
            if (userData.businessCategory) document.getElementById('businessCategory').value = userData.businessCategory;
            if (userData.companyWebsite) document.getElementById('companyWebsite').value = userData.companyWebsite;
            if (userData.companyDescription) document.getElementById('companyDescription').value = userData.companyDescription;
            
            // Populate Compliance
            if (userData.iecNumber) document.getElementById('iecNumber').value = userData.iecNumber;
            if (userData.gstNumber) document.getElementById('gstNumber').value = userData.gstNumber;
            if (userData.panNumber) document.getElementById('panNumber').value = userData.panNumber;
            if (userData.cinNumber) document.getElementById('cinNumber').value = userData.cinNumber;
            if (userData.dgftRegion) document.getElementById('dgftRegion').value = userData.dgftRegion;
            
            // Populate Products
            if (userData.primaryProduct) document.getElementById('primaryProduct').value = userData.primaryProduct;
            if (userData.productCategory) document.getElementById('productCategory').value = userData.productCategory;
            if (userData.hsCode) document.getElementById('hsCode').value = userData.hsCode;
            if (userData.targetCountries && Array.isArray(userData.targetCountries)) {
                const select = document.getElementById('targetCountries');
                Array.from(select.options).forEach(option => {
                    if (userData.targetCountries.includes(option.value)) {
                        option.selected = true;
                    }
                });
            }
            if (userData.monthlyVolume) document.getElementById('monthlyVolume').value = userData.monthlyVolume;
            if (userData.shippingMethod) document.getElementById('shippingMethod').value = userData.shippingMethod;
            
            // Populate Address
            if (userData.businessAddress) document.getElementById('businessAddress').value = userData.businessAddress;
            if (userData.city) document.getElementById('city').value = userData.city;
            if (userData.state) document.getElementById('state').value = userData.state;
            if (userData.country) document.getElementById('country').value = userData.country;
            if (userData.pincode) document.getElementById('pincode').value = userData.pincode;
            
            // Populate Banking
            if (userData.bankName) document.getElementById('bankName').value = userData.bankName;
            if (userData.accountHolderName) document.getElementById('accountHolderName').value = userData.accountHolderName;
            if (userData.accountNumber) document.getElementById('accountNumber').value = userData.accountNumber;
            if (userData.ifscCode) document.getElementById('ifscCode').value = userData.ifscCode;
            if (userData.paymentMethod) document.getElementById('paymentMethod').value = userData.paymentMethod;
            
            // Populate Documents (Base64 strings)
            if (userData.documents) {
                Object.keys(userData.documents).forEach(docType => {
                    const preview = document.getElementById(`${docType}Preview`);
                    if (preview && userData.documents[docType]) {
                        const base64String = userData.documents[docType];
                        const fileName = userData.documents[`${docType}FileName`] || `${docType}.pdf`;
                        const fileType = userData.documents[`${docType}FileType`] || 'application/pdf';
                        
                        // Check if it's an image or document
                        if (fileType.startsWith('image/')) {
                            preview.innerHTML = `
                                <div style="margin-top: 8px;">
                                    <img src="${base64String}" alt="${docType}" style="max-width: 200px; max-height: 200px; border-radius: 4px; border: 1px solid var(--color-border);" />
                                    <br>
                                    <a href="${base64String}" download="${fileName}" style="color: var(--color-primary); text-decoration: none; font-size: 12px; margin-top: 4px; display: inline-block;">Download</a>
                                </div>
                            `;
                        } else {
                            preview.innerHTML = `
                                <div style="margin-top: 8px;">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" style="margin-bottom: 8px;">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                    </svg>
                                    <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px;">${fileName}</div>
                                    <a href="${base64String}" download="${fileName}" style="color: var(--color-primary); text-decoration: none; font-size: 12px;">Download Document</a>
                                </div>
                            `;
                        }
                    }
                });
            }
            
            // Update profile display
            if (userData.fullName) {
                const profileName = document.getElementById('profileName');
                if (profileName) profileName.textContent = userData.fullName;
            }
        } else {
            // Set default email from auth
            const emailInput = document.getElementById('email');
            if (emailInput && user.email) {
                emailInput.value = user.email;
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/**
 * Show profile message
 */
function showProfileMessage(message, type = 'success') {
    const messageEl = document.getElementById('profileMessage');
    if (!messageEl) return;
    
    messageEl.textContent = message;
    messageEl.className = `profile-message ${type} show`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 5000);
}

// ============================================
// FORM HANDLERS
// ============================================

/**
 * Compress image before converting to Base64
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width (default: 800)
 * @param {number} maxHeight - Maximum height (default: 800)
 * @param {number} quality - JPEG quality 0-1 (default: 0.7)
 * @returns {Promise<string>} - Base64 string of compressed image
 */
function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                // Calculate new dimensions
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    } else {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }
                
                // Create canvas and compress
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to base64 with compression
                const base64String = canvas.toDataURL('image/jpeg', quality);
                resolve(base64String);
            };
            
            img.onerror = reject;
            img.src = e.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Handle photo upload - Convert to Base64 and save to Realtime Database
 */
async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showProfileMessage('Please upload an image file', 'error');
        return;
    }
    
    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
        showProfileMessage('Image size should be less than 10MB', 'error');
        return;
    }
    
    const user = auth?.currentUser;
    if (!user) {
        showProfileMessage('Please login to upload photos', 'error');
        return;
    }
    
    if (!database) {
        showProfileMessage('Database is not configured', 'error');
        return;
    }
    
    try {
        showProfileMessage('Processing image...', 'info');
        
        // Compress and convert to Base64
        const base64String = await compressImage(file);
        
        // Show preview immediately
        const photoPreview = document.getElementById('photoPreviewImg');
        const photoPreviewText = document.getElementById('photoPreviewText');
        if (photoPreview) {
            photoPreview.src = base64String;
            photoPreview.style.display = 'block';
        }
        if (photoPreviewText) {
            photoPreviewText.style.display = 'none';
        }
        
        // Save Base64 string to Realtime Database
        showProfileMessage('Saving photo...', 'info');
        await database.ref(`users/${user.uid}/profilePhoto`).set(base64String);
        await database.ref(`users/${user.uid}/profilePhotoUpdatedAt`).set(new Date().toISOString());
        
        // Update user profile (optional - for Firebase Auth profile)
        try {
            await user.updateProfile({
                photoURL: base64String
            });
        } catch (err) {
            console.warn('Could not update auth profile photo:', err);
        }
        
        // Update avatar in header
        const profileAvatar = document.getElementById('profileAvatar');
        const avatarInitials = document.getElementById('avatarInitials');
        if (profileAvatar) {
            profileAvatar.style.backgroundImage = `url(${base64String})`;
            profileAvatar.style.backgroundSize = 'cover';
            profileAvatar.style.backgroundPosition = 'center';
            if (avatarInitials) {
                avatarInitials.style.display = 'none';
            }
        }
        
        showProfileMessage('Profile photo uploaded successfully', 'success');
    } catch (error) {
        console.error('Error uploading photo:', error);
        showProfileMessage('Failed to upload photo. Please try again.', 'error');
    }
}

/**
 * Convert file to Base64 string
 * @param {File} file - File to convert
 * @returns {Promise<string>} - Base64 string
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            resolve(e.target.result);
        };
        
        reader.onerror = (error) => {
            reject(error);
        };
        
        reader.readAsDataURL(file);
    });
}

/**
 * Handle document upload - Convert to Base64 and save to Realtime Database
 */
async function handleDocumentUpload(event, docType) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file size (max 10MB for Base64)
    if (file.size > 10 * 1024 * 1024) {
        showProfileMessage('File size should be less than 10MB', 'error');
        return;
    }
    
    const user = auth?.currentUser;
    if (!user) {
        showProfileMessage('Please login to upload documents', 'error');
        return;
    }
    
    if (!database) {
        showProfileMessage('Database is not configured', 'error');
        return;
    }
    
    try {
        const preview = document.getElementById(`${docType}Preview`);
        if (preview) {
            preview.innerHTML = '<span style="color: var(--color-primary);">Processing...</span>';
        }
        
        showProfileMessage('Converting document to Base64...', 'info');
        
        // Convert file to Base64
        const base64String = await fileToBase64(file);
        
        // Save Base64 string to Realtime Database
        showProfileMessage('Saving document...', 'info');
        const updates = {};
        updates[`users/${user.uid}/documents/${docType}`] = base64String;
        updates[`users/${user.uid}/documents/${docType}FileName`] = file.name;
        updates[`users/${user.uid}/documents/${docType}FileType`] = file.type;
        updates[`users/${user.uid}/${docType}UpdatedAt`] = new Date().toISOString();
        
        await database.ref().update(updates);
        
        // Update preview based on file type
        if (preview) {
            if (file.type.startsWith('image/')) {
                // For images, show preview
                preview.innerHTML = `
                    <div style="margin-top: 8px;">
                        <img src="${base64String}" alt="${docType}" style="max-width: 200px; max-height: 200px; border-radius: 4px; border: 1px solid var(--color-border);" />
                        <br>
                        <a href="${base64String}" download="${file.name}" style="color: var(--color-primary); text-decoration: none; font-size: 12px; margin-top: 4px; display: inline-block;">Download</a>
                    </div>
                `;
            } else {
                // For PDFs and other documents, show download link
                preview.innerHTML = `
                    <div style="margin-top: 8px;">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" style="margin-bottom: 8px;">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                        </svg>
                        <div style="font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px;">${file.name}</div>
                        <a href="${base64String}" download="${file.name}" style="color: var(--color-primary); text-decoration: none; font-size: 12px;">Download Document</a>
                    </div>
                `;
            }
        }
        
        showProfileMessage('Document uploaded successfully', 'success');
    } catch (error) {
        console.error('Error uploading document:', error);
        showProfileMessage('Failed to upload document. Please try again.', 'error');
        
        const preview = document.getElementById(`${docType}Preview`);
        if (preview) {
            preview.innerHTML = '';
        }
    }
}

/**
 * Save basic information
 */
async function saveBasicInfo(event) {
    event.preventDefault();
    
    const user = auth?.currentUser;
    if (!user || !database) {
        showProfileMessage('Firebase is not configured', 'error');
        return;
    }
    
    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        phoneNumber: document.getElementById('phoneNumber').value.trim(),
        alternatePhone: document.getElementById('alternatePhone').value.trim(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        await database.ref(`users/${user.uid}`).update(formData);
        
        // Update user display name
        if (formData.fullName) {
            await user.updateProfile({
                displayName: formData.fullName
            });
        }
        
        updateProfileDisplay(user);
        showProfileMessage('Basic information saved successfully', 'success');
    } catch (error) {
        console.error('Error saving basic info:', error);
        showProfileMessage('Failed to save. Please try again.', 'error');
    }
}

/**
 * Save business information
 */
async function saveBusinessInfo(event) {
    event.preventDefault();
    
    const user = auth?.currentUser;
    if (!user || !database) {
        showProfileMessage('Firebase is not configured', 'error');
        return;
    }
    
    const formData = {
        companyName: document.getElementById('companyName').value.trim(),
        businessType: document.getElementById('businessType').value,
        yearEstablished: document.getElementById('yearEstablished').value,
        businessCategory: document.getElementById('businessCategory').value,
        companyWebsite: document.getElementById('companyWebsite').value.trim(),
        companyDescription: document.getElementById('companyDescription').value.trim(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        await database.ref(`users/${user.uid}`).update(formData);
        showProfileMessage('Business information saved successfully', 'success');
    } catch (error) {
        console.error('Error saving business info:', error);
        showProfileMessage('Failed to save. Please try again.', 'error');
    }
}

/**
 * Save compliance information
 */
async function saveComplianceInfo(event) {
    event.preventDefault();
    
    const user = auth?.currentUser;
    if (!user || !database) {
        showProfileMessage('Firebase is not configured', 'error');
        return;
    }
    
    const formData = {
        iecNumber: document.getElementById('iecNumber').value.trim(),
        gstNumber: document.getElementById('gstNumber').value.trim(),
        panNumber: document.getElementById('panNumber').value.trim(),
        cinNumber: document.getElementById('cinNumber').value.trim(),
        dgftRegion: document.getElementById('dgftRegion').value.trim(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        await database.ref(`users/${user.uid}`).update(formData);
        showProfileMessage('Compliance information saved successfully', 'success');
    } catch (error) {
        console.error('Error saving compliance info:', error);
        showProfileMessage('Failed to save. Please try again.', 'error');
    }
}

/**
 * Save products information
 */
async function saveProductsInfo(event) {
    event.preventDefault();
    
    const user = auth?.currentUser;
    if (!user || !firestore) {
        showProfileMessage('Firebase is not configured', 'error');
        return;
    }
    
    const targetCountriesSelect = document.getElementById('targetCountries');
    const targetCountries = Array.from(targetCountriesSelect.selectedOptions).map(option => option.value);
    
    const formData = {
        primaryProduct: document.getElementById('primaryProduct').value.trim(),
        productCategory: document.getElementById('productCategory').value,
        hsCode: document.getElementById('hsCode').value.trim(),
        targetCountries: targetCountries,
        monthlyVolume: document.getElementById('monthlyVolume').value.trim(),
        shippingMethod: document.getElementById('shippingMethod').value,
        updatedAt: new Date().toISOString()
    };
    
    try {
        await database.ref(`users/${user.uid}`).update(formData);
        showProfileMessage('Product information saved successfully', 'success');
    } catch (error) {
        console.error('Error saving products info:', error);
        showProfileMessage('Failed to save. Please try again.', 'error');
    }
}

/**
 * Save address information
 */
async function saveAddressInfo(event) {
    event.preventDefault();
    
    const user = auth?.currentUser;
    if (!user || !database) {
        showProfileMessage('Firebase is not configured', 'error');
        return;
    }
    
    const formData = {
        businessAddress: document.getElementById('businessAddress').value.trim(),
        city: document.getElementById('city').value.trim(),
        state: document.getElementById('state').value.trim(),
        country: document.getElementById('country').value.trim(),
        pincode: document.getElementById('pincode').value.trim(),
        updatedAt: new Date().toISOString()
    };
    
    try {
        await database.ref(`users/${user.uid}`).update(formData);
        showProfileMessage('Address information saved successfully', 'success');
    } catch (error) {
        console.error('Error saving address info:', error);
        showProfileMessage('Failed to save. Please try again.', 'error');
    }
}

/**
 * Save banking information
 */
async function saveBankingInfo(event) {
    event.preventDefault();
    
    const user = auth?.currentUser;
    if (!user || !database) {
        showProfileMessage('Firebase is not configured', 'error');
        return;
    }
    
    const formData = {
        bankName: document.getElementById('bankName').value.trim(),
        accountHolderName: document.getElementById('accountHolderName').value.trim(),
        accountNumber: document.getElementById('accountNumber').value.trim(),
        ifscCode: document.getElementById('ifscCode').value.trim(),
        paymentMethod: document.getElementById('paymentMethod').value,
        updatedAt: new Date().toISOString()
    };
    
    try {
        await database.ref(`users/${user.uid}`).update(formData);
        showProfileMessage('Banking information saved successfully', 'success');
    } catch (error) {
        console.error('Error saving banking info:', error);
        showProfileMessage('Failed to save. Please try again.', 'error');
    }
}

/**
 * Save documents information
 */
async function saveDocumentsInfo(event) {
    event.preventDefault();
    showProfileMessage('Documents are saved automatically when uploaded', 'info');
}

/**
 * Save settings information
 */
async function saveSettingsInfo(event) {
    event.preventDefault();
    
    const user = auth?.currentUser;
    if (!user) {
        showProfileMessage('User not authenticated', 'error');
        return;
    }
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const newPhoneNumber = document.getElementById('newPhoneNumber').value.trim();
    const twoFactorAuth = document.getElementById('twoFactorAuth').checked;
    
    try {
        // Change password if provided
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                showProfileMessage('New passwords do not match', 'error');
                return;
            }
            
            if (!currentPassword) {
                showProfileMessage('Please enter current password', 'error');
                return;
            }
            
            // Re-authenticate user
            const credential = firebase.auth.EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            await user.reauthenticateWithCredential(credential);
            
            // Update password
            await user.updatePassword(newPassword);
            showProfileMessage('Password changed successfully', 'success');
            
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        }
        
        // Update phone number if provided
        if (newPhoneNumber) {
            // Note: Phone number update requires phone authentication
            // This is a simplified version
            if (database) {
                await database.ref(`users/${user.uid}`).update({
                    phoneNumber: newPhoneNumber
                });
                showProfileMessage('Phone number updated successfully', 'success');
            }
        }
        
        // Save 2FA preference
        if (database) {
            await database.ref(`users/${user.uid}`).update({
                twoFactorAuth: twoFactorAuth
            });
        }
        
    } catch (error) {
        console.error('Error saving settings:', error);
        let errorMessage = 'Failed to save settings. Please try again.';
        
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Current password is incorrect';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'New password is too weak';
        }
        
        showProfileMessage(errorMessage, 'error');
    }
}

/**
 * Handle logout
 */
async function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            await auth?.signOut();
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Error signing out:', error);
            showProfileMessage('Failed to logout. Please try again.', 'error');
        }
    }
}

// ============================================
// eKYC FUNCTIONALITY
// ============================================

// Document options based on country
const INDIAN_ID_PROOFS = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'driving-license', label: 'Driving License' },
    { value: 'voter-id', label: 'Voter ID' }
];

const INTERNATIONAL_ID_PROOFS = [
    { value: 'passport', label: 'Passport' },
    { value: 'national-id', label: 'National Identity Card' },
    { value: 'driving-license', label: 'Driving License' }
];

const INDIAN_BUSINESS_PROOFS = [
    { value: 'gst-certificate', label: 'GST Certificate' },
    { value: 'iec-certificate', label: 'IEC Certificate' },
    { value: 'company-registration', label: 'Company Registration Certificate' },
    { value: 'partnership-deed', label: 'Partnership Deed' },
    { value: 'llp-agreement', label: 'LLP Agreement' }
];

const INTERNATIONAL_BUSINESS_PROOFS = [
    { value: 'business-license', label: 'Business License' },
    { value: 'company-registration', label: 'Company Registration Certificate' },
    { value: 'tax-certificate', label: 'Tax Registration Certificate' },
    { value: 'trade-license', label: 'Trade License' }
];

const INDIAN_BANK_PROOFS = [
    { value: 'cancelled-cheque', label: 'Cancelled Cheque' },
    { value: 'bank-statement', label: 'Bank Statement' },
    { value: 'bank-certificate', label: 'Bank Certificate' }
];

const INTERNATIONAL_BANK_PROOFS = [
    { value: 'bank-statement', label: 'Bank Statement' },
    { value: 'bank-certificate', label: 'Bank Certificate' },
    { value: 'swift-confirmation', label: 'SWIFT Confirmation' }
];

let userCountry = null;
let ekycData = null;
let selfieDataUrl = null;

/**
 * Check eKYC status and show/hide button accordingly
 */
async function checkEKYCStatus() {
    const user = auth?.currentUser;
    if (!user || !firestore) return;

    try {
        const ekycDoc = await firestore.collection('ekyc').doc(user.uid).get();
        
        if (ekycDoc.exists) {
            ekycData = ekycDoc.data();
            
            if (ekycData.ekycCompleted === true) {
                // Hide eKYC button and show status
                const ekycCard = document.getElementById('ekycCard');
                const ekycStatusCard = document.getElementById('ekycStatusCard');
                const videoCallRequestCard = document.getElementById('videoCallRequestCard');
                
                if (ekycCard) ekycCard.style.display = 'none';
                if (ekycStatusCard) {
                    ekycStatusCard.style.display = 'block';
                    
                    const statusIcon = document.getElementById('ekycStatusIcon');
                    const statusTitle = document.getElementById('ekycStatusTitle');
                    const statusMessage = document.getElementById('ekycStatusMessage');
                    
                    if (statusIcon && statusTitle && statusMessage) {
                        const status = ekycData.ekycStatus || 'pending';
                        
                        if (status === 'verified') {
                            statusIcon.textContent = '✓';
                            statusIcon.style.color = '#10b981';
                            statusTitle.textContent = 'eKYC Verified';
                            statusMessage.textContent = 'Your eKYC has been verified successfully.';
                            if (videoCallRequestCard) videoCallRequestCard.style.display = 'none';
                        } else if (status === 'rejected') {
                            statusIcon.textContent = '✗';
                            statusIcon.style.color = '#ef4444';
                            statusTitle.textContent = 'eKYC Rejected';
                            statusMessage.textContent = 'Your eKYC verification was rejected. Please contact support.';
                            if (videoCallRequestCard) videoCallRequestCard.style.display = 'none';
                        } else {
                            // Pending status - show video call request option
                            statusIcon.textContent = '⏳';
                            statusIcon.style.color = '#f59e0b';
                            statusTitle.textContent = 'eKYC Under Review';
                            statusMessage.textContent = 'Your eKYC is under verification. Request a video call to complete verification.';
                            if (videoCallRequestCard) videoCallRequestCard.style.display = 'block';
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error checking eKYC status:', error);
    }
}

/**
 * Open eKYC modal
 */
async function openEKYCModal() {
    const modal = document.getElementById('ekycModal');
    if (!modal) return;
    
    const user = auth?.currentUser;
    if (!user) {
        showEKYCMessage('Please login to complete eKYC', 'error');
        return;
    }
    
    // Fetch user country from Realtime Database
    try {
        if (database) {
            const userRef = database.ref(`users/${user.uid}`);
            const snapshot = await userRef.once('value');
            if (snapshot.exists()) {
                const userData = snapshot.val();
                userCountry = userData.country || 'India'; // Default to India
            } else {
                userCountry = 'India'; // Default to India
            }
        } else {
            userCountry = 'India'; // Default to India
        }
    } catch (error) {
        console.error('Error fetching user country:', error);
        userCountry = 'India'; // Default to India
    }
    
    // Check if eKYC already exists
    try {
        if (firestore) {
            const ekycDoc = await firestore.collection('ekyc').doc(user.uid).get();
            if (ekycDoc.exists) {
                ekycData = ekycDoc.data();
                if (ekycData.ekycCompleted === true) {
                    showEKYCMessage('You have already completed your eKYC. No further action is needed.', 'info');
                    closeEKYCModal();
                    return;
                }
            } else {
                ekycData = null; // Reset if no existing data
            }
        } else {
            ekycData = null;
        }
    } catch (error) {
        console.error('Error checking existing eKYC:', error);
        ekycData = null;
    }
    
    // Populate dropdowns based on country
    populateEKYCForm();
    
    // Pre-fill existing data if available and completed
    if (ekycData && ekycData.ekycCompleted === true) {
        prefillEKYCForm();
    }
    
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

/**
 * Close eKYC modal
 */
function closeEKYCModal() {
    const modal = document.getElementById('ekycModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Stop camera if active
    stopCamera();
    selfieDataUrl = null;
    const selfieInput = document.getElementById('selfieFile');
    if (selfieInput) {
        selfieInput.value = '';
        selfieInput.removeAttribute('data-valid');
    }
    
    // Reset form and re-enable all fields
    const form = document.getElementById('ekycForm');
    if (form) {
        form.reset();
        clearFilePreviews();
        
        // Re-enable all disabled fields
        const disabledFields = form.querySelectorAll('select:disabled, input:disabled');
        disabledFields.forEach(field => {
            field.disabled = false;
            if (field.tagName === 'INPUT' && field.type === 'file') {
                field.required = true;
            }
        });
    }
    
    // Clear message
    const message = document.getElementById('ekycMessage');
    if (message) {
        message.textContent = '';
        message.className = 'ekyc-message';
    }
    
    // Reset submit button
    const submitBtn = document.getElementById('ekycSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit eKYC';
    }
}

/**
 * Populate eKYC form dropdowns based on country
 */
function populateEKYCForm() {
    const isIndia = userCountry && userCountry.toLowerCase() === 'india';
    
    // Identity Proof
    const identitySelect = document.getElementById('identityProofType');
    if (identitySelect) {
        identitySelect.innerHTML = '<option value="">Select ID Proof</option>';
        const options = isIndia ? INDIAN_ID_PROOFS : INTERNATIONAL_ID_PROOFS;
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            identitySelect.appendChild(opt);
        });
    }
    
    // Business Proof
    const businessSelect = document.getElementById('businessProofType');
    if (businessSelect) {
        businessSelect.innerHTML = '<option value="">Select Business Proof</option>';
        const options = isIndia ? INDIAN_BUSINESS_PROOFS : INTERNATIONAL_BUSINESS_PROOFS;
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            businessSelect.appendChild(opt);
        });
    }
    
    // Bank Proof
    const bankSelect = document.getElementById('bankProofType');
    if (bankSelect) {
        bankSelect.innerHTML = '<option value="">Select Bank Proof</option>';
        const options = isIndia ? INDIAN_BANK_PROOFS : INTERNATIONAL_BANK_PROOFS;
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.label;
            bankSelect.appendChild(opt);
        });
    }
}

/**
 * Pre-fill eKYC form with existing data
 */
function prefillEKYCForm() {
    if (!ekycData) return;
    
    // Pre-fill dropdowns
    if (ekycData.selectedIdentityProof) {
        const identitySelect = document.getElementById('identityProofType');
        if (identitySelect) {
            identitySelect.value = ekycData.selectedIdentityProof;
            identitySelect.disabled = true;
        }
    }
    
    if (ekycData.selectedBusinessProof) {
        const businessSelect = document.getElementById('businessProofType');
        if (businessSelect) {
            businessSelect.value = ekycData.selectedBusinessProof;
            businessSelect.disabled = true;
        }
    }
    
    if (ekycData.selectedBankProof) {
        const bankSelect = document.getElementById('bankProofType');
        if (bankSelect) {
            bankSelect.value = ekycData.selectedBankProof;
            bankSelect.disabled = true;
        }
    }
    
    // Disable file inputs if data exists
    const fileInputs = ['identityProofFile', 'businessProofFile', 'bankProofFile', 'selfieFile'];
    fileInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.disabled = true;
            input.required = false;
        }
    });
}

// Camera stream variables
let cameraStream = null;

/**
 * Start camera for selfie capture
 */
async function startCamera() {
    try {
        const video = document.getElementById('cameraVideo');
        const previewContainer = document.getElementById('cameraPreviewContainer');
        const startBtn = document.getElementById('startCameraBtn');
        const captureBtn = document.getElementById('captureBtn');
        const cancelBtn = document.getElementById('cancelCameraBtn');
        
        // Request camera access
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user', // Front camera
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        video.srcObject = cameraStream;
        previewContainer.style.display = 'block';
        startBtn.style.display = 'none';
        captureBtn.style.display = 'inline-block';
        cancelBtn.style.display = 'inline-block';
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        showEKYCMessage('Unable to access camera. Please check permissions.', 'error');
    }
}

/**
 * Capture selfie from camera
 */
function captureSelfie() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const preview = document.getElementById('selfiePreview');
    const selfieInput = document.getElementById('selfieFile');
    
    if (!video || !canvas || !cameraStream) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to Base64 data URL
    const imageUrl = canvas.toDataURL('image/jpeg', 0.9);
    selfieDataUrl = imageUrl;
    
    // Show preview
    preview.innerHTML = `
        <div style="margin-top: 8px;">
            <img src="${imageUrl}" alt="Selfie" style="max-width: 200px; max-height: 200px; border-radius: 4px; border: 1px solid var(--color-border);" />
            <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">Selfie captured</div>
        </div>
    `;
    
    // Mark as valid
    if (selfieInput) {
        selfieInput.value = 'captured';
        selfieInput.setAttribute('data-valid', 'true');
    }
    
    // Stop camera
    stopCamera();
    
    showEKYCMessage('Selfie captured successfully', 'success');
}

/**
 * Stop camera stream
 */
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    const video = document.getElementById('cameraVideo');
    const previewContainer = document.getElementById('cameraPreviewContainer');
    const startBtn = document.getElementById('startCameraBtn');
    const captureBtn = document.getElementById('captureBtn');
    const cancelBtn = document.getElementById('cancelCameraBtn');
    
    if (video) video.srcObject = null;
    if (previewContainer) previewContainer.style.display = 'none';
    if (startBtn) startBtn.style.display = 'inline-block';
    if (captureBtn) captureBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
}

/**
 * Handle file preview
 */
function handleFilePreview(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    const preview = document.getElementById(`${type}Preview`);
    if (!preview) return;
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showEKYCMessage(`${type} file size should be less than 10MB`, 'error');
        event.target.value = '';
        preview.innerHTML = '';
        return;
    }
    
    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <div style="margin-top: 8px;">
                    <img src="${e.target.result}" alt="${type}" style="max-width: 200px; max-height: 200px; border-radius: 4px; border: 1px solid var(--color-border);" />
                    <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">${file.name}</div>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <div style="margin-top: 8px;">
                    <div style="border: 1px solid var(--color-border); border-radius: var(--radius-md); overflow: hidden; height: 200px;">
                        <iframe src="${e.target.result}" type="application/pdf" style="width: 100%; height: 100%; border: none;" title="${file.name}"></iframe>
                    </div>
                    <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">${file.name}</div>
                    <a href="${e.target.result}" download="${file.name}" style="font-size: 12px; color: var(--color-primary); text-decoration: none;">Download PDF</a>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = `
            <div style="margin-top: 8px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2" style="margin-bottom: 8px;">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                <div style="font-size: 12px; color: var(--color-text-secondary);">${file.name}</div>
            </div>
        `;
    }
}

/**
 * Clear all file previews
 */
function clearFilePreviews() {
    const previews = ['identityProofPreview', 'businessProofPreview', 'bankProofPreview', 'selfiePreview'];
    previews.forEach(id => {
        const preview = document.getElementById(id);
        if (preview) preview.innerHTML = '';
    });
}

/**
 * Handle identity proof change
 */
function handleIdentityProofChange() {
    // This can be used for additional validation if needed
}

/**
 * Submit eKYC form
 */
async function submitEKYC(event) {
    event.preventDefault();
    
    const user = auth?.currentUser;
    if (!user) {
        showEKYCMessage('Please login to submit eKYC', 'error');
        return;
    }
    
    if (!firestore) {
        showEKYCMessage('Firebase services are not configured', 'error');
        return;
    }
    
    // Check if already completed
    try {
        const ekycDoc = await firestore.collection('ekyc').doc(user.uid).get();
        if (ekycDoc.exists && ekycDoc.data().ekycCompleted === true) {
            showEKYCMessage('You have already completed your eKYC', 'error');
            return;
        }
    } catch (error) {
        console.error('Error checking eKYC status:', error);
    }
    
    const submitBtn = document.getElementById('ekycSubmitBtn');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
    }
    
    try {
        // Get form values
        const identityProofType = document.getElementById('identityProofType').value;
        const businessProofType = document.getElementById('businessProofType').value;
        const bankProofType = document.getElementById('bankProofType').value;
        
        // Get files
        const identityProofFile = document.getElementById('identityProofFile').files[0];
        const businessProofFile = document.getElementById('businessProofFile').files[0];
        const bankProofFile = document.getElementById('bankProofFile').files[0];
        
        // Validate files
        if (!identityProofFile || !businessProofFile || !bankProofFile) {
            showEKYCMessage('Please upload all required documents', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit eKYC';
            }
            return;
        }
        
        if (!selfieDataUrl) {
            showEKYCMessage('Please capture a live selfie before submitting', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit eKYC';
            }
            return;
        }
        
        showEKYCMessage('Processing documents...', 'info');
        
        // Convert files to Base64 (Data URLs)
        const [identityBase64, businessBase64, bankBase64] = await Promise.all([
            fileToBase64(identityProofFile),
            fileToBase64(businessProofFile),
            fileToBase64(bankProofFile)
        ]);
        
        const timestampIso = new Date().toISOString();
        const documentsPayload = {
            identityProof: {
                dataUrl: identityBase64,
                fileName: identityProofFile.name,
                fileType: identityProofFile.type,
                uploadedAt: timestampIso
            },
            businessProof: {
                dataUrl: businessBase64,
                fileName: businessProofFile.name,
                fileType: businessProofFile.type,
                uploadedAt: timestampIso
            },
            bankProof: {
                dataUrl: bankBase64,
                fileName: bankProofFile.name,
                fileType: bankProofFile.type,
                uploadedAt: timestampIso
            },
            selfie: {
                dataUrl: selfieDataUrl,
                fileName: `selfie-${Date.now()}.jpg`,
                fileType: 'image/jpeg',
                uploadedAt: timestampIso
            }
        };
        
        // Save metadata + documents to Firestore
        const ekycData = {
            ekycStatus: 'pending',
            ekycCompleted: true,
            selectedIdentityProof: identityProofType,
            selectedBusinessProof: businessProofType,
            selectedBankProof: bankProofType,
            country: userCountry || 'India',
            userName: document.getElementById('fullName')?.value?.trim() || user.displayName || '',
            userEmail: user.email,
            documents: documentsPayload,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: timestampIso
        };
        
        await firestore.collection('ekyc').doc(user.uid).set(ekycData, { merge: true });
        
        showEKYCMessage('Your eKYC has been submitted successfully. You can now request a video call for verification.', 'success');
        
        // Close modal after 2 seconds
        setTimeout(() => {
            closeEKYCModal();
            checkEKYCStatus(); // Refresh status
            
            // Show video call request card
            const videoCallRequestCard = document.getElementById('videoCallRequestCard');
            if (videoCallRequestCard) {
                videoCallRequestCard.style.display = 'block';
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting eKYC:', error);
        showEKYCMessage('Failed to submit eKYC. Please try again.', 'error');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit eKYC';
        }
    }
}

/**
 * Show eKYC message
 */
function showEKYCMessage(message, type = 'success') {
    const messageEl = document.getElementById('ekycMessage');
    if (!messageEl) return;
    
    messageEl.textContent = message;
    messageEl.className = `ekyc-message ${type} show`;
    
    // Auto-hide after 5 seconds for success/info, keep error visible
    if (type !== 'error') {
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 5000);
    }
}

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('ekycModal');
        if (modal && modal.classList.contains('active')) {
            closeEKYCModal();
        }
        const videoModal = document.getElementById('videoCallModal');
        if (videoModal && videoModal.classList.contains('active')) {
            closeVideoCallModal();
        }
    }
});

// ============================================
// VIDEO CALL FUNCTIONALITY
// ============================================

let localStream = null;
let remoteStream = null;
let peerConnection = null;
let videoCallRequestId = null;
let videoCallListener = null;

// WebRTC Configuration (using Google's public STUN servers)
const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

/**
 * Request video call with agent
 */
async function requestVideoCall() {
    const user = auth?.currentUser;
    if (!user || !firestore) {
        showEKYCMessage('Please login to request video call', 'error');
        return;
    }
    
    // Open video call modal
    const modal = document.getElementById('videoCallModal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        
        // Show waiting state
        document.getElementById('waitingForAgent').style.display = 'block';
        document.getElementById('videoCallInterface').style.display = 'none';
        document.getElementById('callEnded').style.display = 'none';
    }
    
    try {
        // Create video call request in Firestore
        const requestData = {
            userId: user.uid,
            userEmail: user.email,
            userName: user.displayName || user.email,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
        };
        
        const requestRef = await firestore.collection('videoCallRequests').add(requestData);
        videoCallRequestId = requestRef.id;
        
        // Listen for agent acceptance
        listenForAgentAcceptance(requestRef.id);
        
    } catch (error) {
        console.error('Error requesting video call:', error);
        showEKYCMessage('Failed to request video call. Please try again.', 'error');
        closeVideoCallModal();
    }
}

/**
 * Listen for agent acceptance of video call
 */
function listenForAgentAcceptance(requestId) {
    if (!firestore) return;
    
    videoCallListener = firestore.collection('videoCallRequests').doc(requestId)
        .onSnapshot((doc) => {
            if (!doc.exists) return;
            
            const data = doc.data();
            
            if (data.status === 'accepted' && data.agentId) {
                // Agent accepted, start video call
                startVideoCall(data.agentId, requestId);
            } else if (data.status === 'rejected') {
                showEKYCMessage('Video call request was rejected. Please try again later.', 'error');
                closeVideoCallModal();
            } else if (data.status === 'completed') {
                // Call completed
                endVideoCall();
                document.getElementById('waitingForAgent').style.display = 'none';
                document.getElementById('videoCallInterface').style.display = 'none';
                document.getElementById('callEnded').style.display = 'block';
                
                // Check eKYC status
                checkEKYCStatus();
            }
        }, (error) => {
            console.error('Error listening for agent acceptance:', error);
        });
}

/**
 * Start video call with agent
 */
async function startVideoCall(agentId, requestId) {
    try {
        // Get user media
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        const localVideo = document.getElementById('localVideo');
        if (localVideo) {
            localVideo.srcObject = localStream;
        }
        
        // Create peer connection
        peerConnection = new RTCPeerConnection(rtcConfiguration);
        
        // Add local stream tracks
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        // Handle remote stream
        peerConnection.ontrack = (event) => {
            remoteStream = event.streams[0];
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo) {
                remoteVideo.srcObject = remoteStream;
            }
        };
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                firestore.collection('videoCallRequests').doc(requestId).update({
                    iceCandidate: event.candidate,
                    updatedAt: new Date().toISOString()
                });
            }
        };
        
        // Create offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // Send offer to agent
        await firestore.collection('videoCallRequests').doc(requestId).update({
            offer: offer,
            status: 'connecting',
            updatedAt: new Date().toISOString()
        });
        
        // Show video interface
        document.getElementById('waitingForAgent').style.display = 'none';
        document.getElementById('videoCallInterface').style.display = 'block';
        
        // Listen for answer from agent
        listenForAgentAnswer(requestId);
        
    } catch (error) {
        console.error('Error starting video call:', error);
        showEKYCMessage('Failed to start video call. Please check camera and microphone permissions.', 'error');
        closeVideoCallModal();
    }
}

/**
 * Listen for answer from agent
 */
function listenForAgentAnswer(requestId) {
    if (!firestore) return;
    
    const answerListener = firestore.collection('videoCallRequests').doc(requestId)
        .onSnapshot((doc) => {
            if (!doc.exists) return;
            
            const data = doc.data();
            
            if (data.answer && peerConnection && peerConnection.signalingState !== 'stable') {
                peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
            
            if (data.iceCandidate && peerConnection) {
                peerConnection.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
            }
        });
}

/**
 * Toggle mute
 */
function toggleMute() {
    if (localStream) {
        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        
        const muteBtn = document.getElementById('muteBtn');
        if (muteBtn) {
            muteBtn.classList.toggle('muted', !audioTracks[0].enabled);
        }
    }
}

/**
 * Toggle video
 */
function toggleVideo() {
    if (localStream) {
        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        
        const videoBtn = document.getElementById('videoBtn');
        if (videoBtn) {
            videoBtn.classList.toggle('disabled', !videoTracks[0].enabled);
        }
    }
}

/**
 * End video call
 */
async function endVideoCall() {
    // Stop local stream
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    // Close peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    
    // Update request status
    if (videoCallRequestId && firestore) {
        try {
            await firestore.collection('videoCallRequests').doc(videoCallRequestId).update({
                status: 'ended',
                endedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error ending video call:', error);
        }
    }
    
    // Remove listeners
    if (videoCallListener) {
        videoCallListener();
        videoCallListener = null;
    }
    
    videoCallRequestId = null;
}

/**
 * Close video call modal
 */
function closeVideoCallModal() {
    const modal = document.getElementById('videoCallModal');
    if (!modal) return;
    
    // End call if active
    if (localStream || peerConnection) {
        endVideoCall();
    }
    
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    
    // Reset UI
    document.getElementById('waitingForAgent').style.display = 'block';
    document.getElementById('videoCallInterface').style.display = 'none';
    document.getElementById('callEnded').style.display = 'none';
    
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    if (localVideo) localVideo.srcObject = null;
    if (remoteVideo) remoteVideo.srcObject = null;
}


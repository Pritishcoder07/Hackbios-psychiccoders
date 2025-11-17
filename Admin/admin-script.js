/**
 * Admin Panel - eKYC Verification Script
 * Handles video call requests, WebRTC connections, and eKYC approval
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
    databaseURL: "https://expoter-af015-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
let firebaseApp, auth, database, firestore;
try {
    try {
        firebaseApp = firebase.app();
    } catch (e) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
    }
    
    auth = firebase.auth();
    database = firebase.database();
    firestore = firebase.firestore();
    
    console.log('Firebase initialized successfully for Admin Panel');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// ============================================
// AUTHENTICATION
// ============================================

auth?.onAuthStateChanged((user) => {
    if (user) {
        loadAdminData(user);
        initializeAdminPanel();
    } else {
        // Redirect to login (reuse main login page)
        window.location.href = '../index.html';
    }
});

function loadAdminData(user) {
    const adminName = document.getElementById('adminName');
    if (adminName) {
        adminName.textContent = user.displayName || user.email || 'Admin';
    }
}

// ============================================
// ADMIN PANEL INITIALIZATION
// ============================================

let videoCallRequestsListener = null;
let activeRequestId = null;
let activeUserId = null;
let adminLocalStream = null;
let adminPeerConnection = null;
let ekycData = null;

const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

function initializeAdminPanel() {
    listenForVideoCallRequests();
}

/**
 * Listen for pending video call requests
 */
function listenForVideoCallRequests() {
    if (!firestore) return;
    
    const requestsList = document.getElementById('videoCallRequestsList');
    
    videoCallRequestsListener = firestore.collection('videoCallRequests')
        .where('status', '==', 'pending')
        .orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
            requestsList.innerHTML = '';
            
            if (snapshot.empty) {
                requestsList.innerHTML = '<div class="empty-state">No pending video call requests</div>';
                return;
            }
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                const requestItem = createRequestItem(doc.id, data);
                requestsList.appendChild(requestItem);
            });
        }, (error) => {
            console.error('Error listening for video call requests:', error);
        });
}

/**
 * Create request item element
 */
function createRequestItem(requestId, data) {
    const item = document.createElement('div');
    item.className = 'request-item';
    
    const timeAgo = getTimeAgo(data.createdAt);
    
    item.innerHTML = `
        <div class="request-info">
            <h3>${data.userName || 'User'}</h3>
            <p>${data.userEmail || ''}</p>
            <p style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">Requested ${timeAgo}</p>
        </div>
        <div class="request-actions">
            <button class="btn-accept" onclick="acceptVideoCall('${requestId}', '${data.userId}')">Accept</button>
            <button class="btn-reject-request" onclick="rejectVideoCallRequest('${requestId}')">Reject</button>
        </div>
    `;
    
    return item;
}

/**
 * Get time ago string
 */
function getTimeAgo(timestamp) {
    if (!timestamp) return 'just now';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diff = Math.floor((now - time) / 1000);
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

/**
 * Accept video call request
 */
async function acceptVideoCall(requestId, userId) {
    const user = auth?.currentUser;
    if (!user || !firestore) return;
    
    activeRequestId = requestId;
    activeUserId = userId;
    
    try {
        await firestore.collection('videoCallRequests').doc(requestId).update({
            status: 'accepted',
            agentId: user.uid,
            agentEmail: user.email,
            acceptedAt: new Date().toISOString()
        });
        
        await loadEKYCData(userId);
        
        document.getElementById('activeCallSection').style.display = 'block';
        
        await startAdminVideoCall(requestId);
        listenForUserOffer(requestId);
        
    } catch (error) {
        console.error('Error accepting video call:', error);
        alert('Failed to accept video call. Please try again.');
    }
}

/**
 * Reject video call request
 */
async function rejectVideoCallRequest(requestId) {
    if (!firestore) return;
    
    if (!confirm('Are you sure you want to reject this video call request?')) {
        return;
    }
    
    try {
        await firestore.collection('videoCallRequests').doc(requestId).update({
            status: 'rejected',
            rejectedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error rejecting video call request:', error);
        alert('Failed to reject request. Please try again.');
    }
}

/**
 * Load eKYC data for user
 */
async function loadEKYCData(userId) {
    if (!firestore) return;
    
    try {
        const ekycDoc = await firestore.collection('ekyc').doc(userId).get();
        if (ekycDoc.exists) {
            ekycData = ekycDoc.data();
            
            const callUserName = document.getElementById('callUserName');
            const callUserEmail = document.getElementById('callUserEmail');
            
            if (callUserName) {
                callUserName.textContent = ekycData.userName || 'User';
            }
            if (callUserEmail) {
                callUserEmail.textContent = ekycData.userEmail || '';
            }
            
            loadDocuments();
        }
    } catch (error) {
        console.error('Error loading eKYC data:', error);
    }
}

/**
 * Load documents for review
 */
function loadDocuments() {
    if (!ekycData) return;
    
    const documentsGrid = document.getElementById('documentsGrid');
    if (!documentsGrid) return;
    
    documentsGrid.innerHTML = '';
    
    const documentsData = ekycData.documents || {};
    const documentMap = [
        { key: 'identityProof', label: 'Identity Proof' },
        { key: 'businessProof', label: 'Business Proof' },
        { key: 'bankProof', label: 'Bank Proof' },
        { key: 'selfie', label: 'Selfie' }
    ];
    
    documentMap.forEach(({ key, label }) => {
        const doc = documentsData[key];
        if (!doc || !doc.dataUrl) return;
        
        const docItem = document.createElement('div');
        docItem.className = 'document-item';
        
        const isImage = doc.fileType?.startsWith('image/');
        const safeFileName = doc.fileName || `${key}.file`;
        
        docItem.innerHTML = `
            <h4>${label}</h4>
            ${isImage ?
                `<img src="${doc.dataUrl}" alt="${label}" class="document-preview" />` :
                `<div style="padding: 20px; text-align: center; background: var(--color-bg-tertiary); border-radius: 8px; margin-bottom: 8px;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <div style="margin-top: 8px; font-size: 12px; color: var(--color-text-secondary);">${safeFileName}</div>
                </div>`
            }
            <a href="${doc.dataUrl}" download="${safeFileName}" class="document-link">Download</a>
        `;
        
        documentsGrid.appendChild(docItem);
    });
}

/**
 * Start admin video call
 */
async function startAdminVideoCall(requestId) {
    try {
        adminLocalStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        
        const adminLocalVideo = document.getElementById('adminLocalVideo');
        if (adminLocalVideo) {
            adminLocalVideo.srcObject = adminLocalStream;
        }
        
        adminPeerConnection = new RTCPeerConnection(rtcConfiguration);
        
        adminLocalStream.getTracks().forEach(track => {
            adminPeerConnection.addTrack(track, adminLocalStream);
        });
        
        adminPeerConnection.ontrack = (event) => {
            const remoteStream = event.streams[0];
            const adminRemoteVideo = document.getElementById('adminRemoteVideo');
            if (adminRemoteVideo) {
                adminRemoteVideo.srcObject = remoteStream;
            }
        };
        
        adminPeerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                firestore.collection('videoCallRequests').doc(requestId).update({
                    agentIceCandidate: event.candidate,
                    updatedAt: new Date().toISOString()
                });
            }
        };
        
    } catch (error) {
        console.error('Error starting admin video call:', error);
        alert('Failed to start video call. Please check camera and microphone permissions.');
    }
}

/**
 * Listen for offer from user
 */
function listenForUserOffer(requestId) {
    if (!firestore) return;
    
    firestore.collection('videoCallRequests').doc(requestId)
        .onSnapshot(async (doc) => {
            if (!doc.exists) return;
            
            const data = doc.data();
            
            if (data.offer && adminPeerConnection && adminPeerConnection.signalingState === 'stable') {
                await adminPeerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                
                const answer = await adminPeerConnection.createAnswer();
                await adminPeerConnection.setLocalDescription(answer);
                
                await firestore.collection('videoCallRequests').doc(requestId).update({
                    answer: answer,
                    status: 'connected',
                    updatedAt: new Date().toISOString()
                });
            }
            
            if (data.iceCandidate && adminPeerConnection) {
                try {
                    await adminPeerConnection.addIceCandidate(new RTCIceCandidate(data.iceCandidate));
                } catch (error) {
                    console.error('Error adding ICE candidate:', error);
                }
            }
        });
}

/**
 * Toggle admin mute
 */
function toggleAdminMute() {
    if (adminLocalStream) {
        const audioTracks = adminLocalStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        
        const muteBtn = document.getElementById('adminMuteBtn');
        if (muteBtn) {
            muteBtn.classList.toggle('muted', !audioTracks[0].enabled);
        }
    }
}

/**
 * Toggle admin video
 */
function toggleAdminVideo() {
    if (adminLocalStream) {
        const videoTracks = adminLocalStream.getVideoTracks();
        videoTracks.forEach(track => {
            track.enabled = !track.enabled;
        });
        
        const videoBtn = document.getElementById('adminVideoBtn');
        if (videoBtn) {
            videoBtn.classList.toggle('disabled', !videoTracks[0].enabled);
        }
    }
}

/**
 * End admin call
 */
async function endAdminCall() {
    if (adminLocalStream) {
        adminLocalStream.getTracks().forEach(track => track.stop());
        adminLocalStream = null;
    }
    
    if (adminPeerConnection) {
        adminPeerConnection.close();
        adminPeerConnection = null;
    }
    
    if (activeRequestId && firestore) {
        try {
            await firestore.collection('videoCallRequests').doc(activeRequestId).update({
                status: 'ended',
                endedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error ending call:', error);
        }
    }
    
    document.getElementById('activeCallSection').style.display = 'none';
    
    activeRequestId = null;
    activeUserId = null;
    ekycData = null;
}

/**
 * Approve eKYC
 */
async function approveEKYC() {
    if (!activeUserId || !firestore) return;
    
    if (!confirm('Approve eKYC for this user? This action cannot be undone.')) {
        return;
    }
    
    try {
        await firestore.collection('ekyc').doc(activeUserId).update({
            ekycStatus: 'verified',
            verifiedAt: new Date().toISOString(),
            verifiedBy: auth.currentUser.uid,
            verifiedByEmail: auth.currentUser.email
        });
        
        if (activeRequestId) {
            await firestore.collection('videoCallRequests').doc(activeRequestId).update({
                status: 'completed',
                ekycStatus: 'verified',
                completedAt: new Date().toISOString()
            });
        }
        
        alert('eKYC approved successfully!');
        endAdminCall();
        
    } catch (error) {
        console.error('Error approving eKYC:', error);
        alert('Failed to approve eKYC. Please try again.');
    }
}

/**
 * Reject eKYC
 */
async function rejectEKYC() {
    if (!activeUserId || !firestore) return;
    
    const reason = prompt('Please enter a reason for rejection:');
    if (!reason) return;
    
    if (!confirm('Reject eKYC for this user?')) {
        return;
    }
    
    try {
        await firestore.collection('ekyc').doc(activeUserId).update({
            ekycStatus: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedBy: auth.currentUser.uid,
            rejectedByEmail: auth.currentUser.email,
            rejectionReason: reason
        });
        
        if (activeRequestId) {
            await firestore.collection('videoCallRequests').doc(activeRequestId).update({
                status: 'completed',
                ekycStatus: 'rejected',
                completedAt: new Date().toISOString()
            });
        }
        
        alert('eKYC rejected.');
        endAdminCall();
        
    } catch (error) {
        console.error('Error rejecting eKYC:', error);
        alert('Failed to reject eKYC. Please try again.');
    }
}

/**
 * Handle admin logout
 */
async function handleAdminLogout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            if (adminLocalStream || adminPeerConnection) {
                await endAdminCall();
            }
            
            if (videoCallRequestsListener) {
                videoCallRequestsListener();
            }
            
            await auth?.signOut();
            window.location.href = '../index.html';
        } catch (error) {
            console.error('Error signing out:', error);
            alert('Failed to logout. Please try again.');
        }
    }
}


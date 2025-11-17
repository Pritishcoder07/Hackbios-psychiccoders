# Admin Panel Setup Guide

This guide will help you set up and use the Admin Panel for eKYC verification with video calling.

## 📋 Prerequisites

1. **Firebase Project Setup**
   - Firebase Authentication enabled
   - Firestore Database enabled
   - Firebase Storage enabled
   - Realtime Database enabled (optional, for user data)
   - **Important:** set `storageBucket` in your Firebase config (e.g., `your-project-id.appspot.com`)

2. **Admin Account**
   - Create an admin user account in Firebase Authentication
   - You can use the same login system or create a separate admin login

## 🚀 Setup Steps

### Step 1: Access Admin Panel

1. Navigate to the new `Admin/` folder and open `Admin/admin-panel.html` in your browser
2. Login with your admin credentials (using the same Firebase Auth system)

### Step 2: Firebase Security Rules

Update your Firestore security rules to allow admin access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Video call requests - admins can read/write, users can create
    match /videoCallRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
    
    // eKYC documents - admins can read/write, users can read their own
    match /ekyc/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true);
    }
    
    // Admin collection (optional - for admin verification)
    match /admins/{adminId} {
      allow read, write: if request.auth != null && request.auth.uid == adminId;
    }
  }
}
```

### Step 3: Firebase Storage Rules

Update Storage rules for document access:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // eKYC documents
    match /ekyc/{userId}/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🎯 How to Use Admin Panel

### 1. View Pending Video Call Requests

- The admin panel automatically shows all pending video call requests
- Each request displays:
  - User name and email
  - Time when request was made
  - Accept/Reject buttons

### 2. Accept a Video Call Request

1. Click **"Accept"** on a pending request
2. The video call interface will appear
3. Your camera and microphone will be activated
4. Wait for the user to connect (they will see you once connected)

### 3. Review Documents During Call

- All user documents are displayed in the document review section:
  - Identity Proof
  - Business Proof
  - Address Proof
  - Bank Proof
  - Selfie
- Click **"View Document"** to open documents in a new tab

### 4. Verify User Identity

During the video call:
- Ask the user to show their ID documents on camera
- Compare with uploaded documents
- Verify the selfie matches the person on video
- Ask any additional verification questions

### 5. Approve or Reject eKYC

After verification:

**To Approve:**
1. Click **"Approve eKYC"** button
2. Confirm the action
3. The user's eKYC status will be updated to "verified"
4. The video call will end automatically

**To Reject:**
1. Click **"Reject eKYC"** button
2. Enter a reason for rejection
3. Confirm the action
4. The user's eKYC status will be updated to "rejected"
5. The video call will end automatically

## 🔧 Video Call Controls

- **Mute/Unmute**: Toggle your microphone
- **Video On/Off**: Toggle your camera
- **End Call**: End the video call (does not approve/reject eKYC)

## 📱 Features

### Real-time Updates
- New video call requests appear automatically
- No page refresh needed
- Real-time status updates

### Document Review
- View all uploaded documents
- Download documents for offline review
- Compare documents with video verification

### WebRTC Video Calling
- Peer-to-peer video connection
- Low latency communication
- Works on modern browsers (Chrome, Firefox, Safari, Edge)

## 🔒 Security Considerations

1. **Admin Authentication**: Ensure only authorized admins can access the panel
2. **Document Access**: Documents are stored securely in Firebase Storage
3. **Video Calls**: WebRTC connections are encrypted
4. **Audit Trail**: All approvals/rejections are logged with timestamps and admin info

## 🐛 Troubleshooting

### Video/Audio Not Working
- Check browser permissions for camera and microphone
- Ensure HTTPS is enabled (required for WebRTC)
- Try refreshing the page

### Documents Not Loading
- Check Firebase Storage rules
- Verify document URLs in Firestore
- Check browser console for errors

### Video Call Connection Issues
- Check internet connection
- Ensure STUN servers are accessible
- For production, consider using TURN servers for better connectivity

## 📝 Notes

- The admin panel uses the same Firebase configuration as the main dashboard
- Multiple admins can use the panel simultaneously
- Video calls are peer-to-peer (no server in between)
- All actions are logged in Firestore for audit purposes

## 🚀 Production Recommendations

1. **Use TURN Servers**: For better connectivity behind firewalls/NATs
2. **Admin Role Management**: Implement proper admin role verification
3. **Recording**: Consider recording video calls for compliance (requires user consent)
4. **Notifications**: Add push notifications for new video call requests
5. **Queue System**: Implement a queue system if multiple requests come in

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify Firebase configuration
3. Check Firestore and Storage rules
4. Ensure all Firebase services are enabled

---

**Important**: Always test the video calling feature in a production-like environment before deploying to ensure WebRTC works correctly with your network setup.


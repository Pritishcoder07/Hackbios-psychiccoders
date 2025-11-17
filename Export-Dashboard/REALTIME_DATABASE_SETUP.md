# Firebase Realtime Database Setup Guide

## Step 1: Enable Realtime Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **expoter-af015**
3. Click on **Realtime Database** in the left sidebar
4. Click **Create Database**
5. Choose a location (select closest to your users)
6. Choose **Start in test mode** (we'll update rules next)

## Step 2: Get Database URL

After creating the database, you'll see the database URL. It should look like:
```
https://expoter-af015-default-rtdb.firebaseio.com/
```

**Important:** Make sure this URL matches the `databaseURL` in `dashboard-script.js` (line 43).

## Step 3: Configure Database Rules

1. Go to **Realtime Database** → **Rules** tab
2. Replace the default rules with these secure rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

3. Click **Publish**

### What These Rules Do:
- Users can only read/write their own data
- Each user's data is stored under `users/{userId}/`
- Only authenticated users can access the database

## Step 4: Update databaseURL in Code

If your database URL is different, update it in `dashboard-script.js`:

```javascript
databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com/"
```

## Data Structure

Your data will be stored like this:

```
users/
  └── {userId}/
      ├── fullName: "John Doe"
      ├── email: "john@example.com"
      ├── phoneNumber: "+1234567890"
      ├── companyName: "ABC Exports"
      ├── businessType: "pvt-ltd"
      ├── documents/
      │   ├── iecCertificate: "https://..."
      │   ├── gstCertificate: "https://..."
      │   └── ...
      └── ...
```

## Testing

1. Login to the dashboard
2. Fill out profile information
3. Click "Save Changes"
4. Go to Firebase Console → Realtime Database
5. You should see your data under `users/{yourUserId}/`

## Troubleshooting

### "Permission Denied" Error
- Check that database rules are published
- Verify user is authenticated
- Make sure rules allow read/write for authenticated users

### "Database URL not found"
- Verify Realtime Database is enabled
- Check the database URL in Firebase Console
- Update `databaseURL` in the code

### Data not saving
- Check browser console for errors
- Verify Firebase initialization is successful
- Check network tab for failed requests

## Security Best Practices

1. **Never expose your database rules publicly** - Keep them secure
2. **Use authentication** - Always require users to be authenticated
3. **Validate data** - Add validation rules in your code
4. **Limit access** - Users should only access their own data

## Need Help?

- Firebase Realtime Database Docs: https://firebase.google.com/docs/database
- Firebase Console: https://console.firebase.google.com/


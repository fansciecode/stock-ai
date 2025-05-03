# Firebase Storage Permissions Setup Guide

To fix the permission error: `firebase-adminsdk-fbsvc@ibcm-28799.iam.gserviceaccount.com does not have storage.objects.create access`, follow these steps:

## Using Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `ibcm-28799`
3. Navigate to **Storage > Buckets**
4. Find your bucket: `ibcmserver_init`
5. Click on the **Permissions** tab
6. Click **Add Principal**
7. Enter the service account email: `firebase-adminsdk-fbsvc@ibcm-28799.iam.gserviceaccount.com`
8. Select the following roles:
   - **Storage Object Admin** (allows creating, reading, updating, and deleting objects)
   - **Storage Admin** (optional, for full control)
9. Click **Save**

## Using gsutil (Google Cloud SDK)

If you have Google Cloud SDK installed, you can also use the command line:

```bash
# Grant Object Admin role to the service account
gsutil iam ch serviceAccount:firebase-adminsdk-fbsvc@ibcm-28799.iam.gserviceaccount.com:objectAdmin gs://ibcmserver_init

# Or grant Storage Admin role for full control
gsutil iam ch serviceAccount:firebase-adminsdk-fbsvc@ibcm-28799.iam.gserviceaccount.com:admin gs://ibcmserver_init
```

## Verify Permissions

After setting the permissions, restart your server and check if the issue is resolved. You should see the following log message:

```
Firebase Storage bucket access confirmed
```

## Additional Troubleshooting

If you continue to experience permission issues:

1. Make sure your bucket name is exactly `ibcmserver_init`
2. Make sure your Firebase project ID is `ibcm-28799`
3. Check if the bucket exists in your Firebase project

### Creating a Bucket (if needed)

If the bucket doesn't exist:

1. Go to Firebase Console > Storage
2. Click "Get Started"
3. Follow the setup process
4. Create a bucket named `ibcmserver_init`

After these steps, your Firebase Admin SDK should have proper permissions to upload files to Firebase Storage. 
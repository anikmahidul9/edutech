-- This is a schema reference for your Firestore collections
-- You can use this to understand the data structure

-- users collection
-- Document ID: Firebase UID
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "photoURL": "string",
  "role": "student | teacher | admin",
  "isApproved": boolean (for teachers),
  "createdAt": timestamp,
  "updatedAt": timestamp
}

-- courses collection
-- Document ID: auto-generated
{
  "title": "string",
  "slug": "string",
  "description": "string",
  "thumbnail": "string",
  "instructorId": "string (uid)",
  "price": number,
  "category": "string",
  "level": "beginner | intermediate | advanced",
  "isPublished": boolean,
  "enrollmentCount": number,
  "rating": number,
  "createdAt": timestamp,
  "updatedAt": timestamp
}

-- lessons collection
-- Sub-collection under courses/lessons
{
  "title": "string",
  "content": "string (markdown/html)",
  "videoUrl": "string",
  "order": number,
  "duration": number (minutes),
  "isFree": boolean
}

-- enrollments collection
-- Document ID: auto-generated or composite (uid_courseId)
{
  "userId": "string (uid)",
  "courseId": "string",
  "status": "active | completed",
  "progress": number (percentage),
  "purchasedAt": timestamp,
  "lastAccessed": timestamp
}

-- transactions collection
-- Document ID: auto-generated (linked to SSLCommerz tran_id)
{
  "userId": "string",
  "courseId": "string",
  "amount": number,
  "currency": "BDT",
  "status": "pending | success | failed",
  "tran_id": "string",
  "payment_id": "string",
  "createdAt": timestamp
}


export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  author: string;
}

export interface User {
    id: string;
    displayName: string;
    photoURL: string;
    coins: number;
    role?: string;
    bio?: string;
}

export interface Review {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  createdAt: any; // Firestore timestamp
}


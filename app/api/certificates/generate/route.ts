import { NextResponse } from "next/server"
import { db } from "@/lib/firebase/config"
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs } from "firebase/firestore"
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    const { userId, courseId, grade } = await request.json()
    console.log("Received request to generate certificate:", { userId, courseId, grade });

    if (!userId || !courseId || !grade) {
      console.error("Missing required fields:", { userId, courseId, grade });
      return NextResponse.json({ message: "Missing required fields: userId, courseId, grade" }, { status: 400 })
    }

    // 1. Fetch Student Name
    const userDoc = await getDoc(doc(db, "users", userId))
    if (!userDoc.exists()) {
      console.error("Student not found for userId:", userId);
      return NextResponse.json({ message: "Student not found" }, { status: 404 })
    }
    const studentName = userDoc.data().displayName || userDoc.data().email;
    console.log("Fetched student name:", studentName);

    // 2. Fetch Course Details
    const courseDoc = await getDoc(doc(db, "courses", courseId))
    if (!courseDoc.exists()) {
      console.error("Course not found for courseId:", courseId);
      return NextResponse.json({ message: "Course not found" }, { status: 404 })
    }
    const courseData = courseDoc.data();
    const courseName = courseData.title;
    const teacherId = courseData.teacherId;
    const departmentId = courseData.departmentId;
    console.log("Fetched course details:", { courseName, teacherId, departmentId });

    // 3. Fetch Teacher Name
    const teacherDoc = await getDoc(doc(db, "users", teacherId))
    const teacherName = teacherDoc.exists() ? (teacherDoc.data().displayName || teacherDoc.data().email) : "Unknown Instructor";
    console.log("Fetched teacher name:", teacherName);

    // 4. Fetch Department Name
    let departmentName = "N/A";
    if (departmentId) {
      const departmentDoc = await getDoc(doc(db, "departments", departmentId));
      if (departmentDoc.exists()) {
        departmentName = departmentDoc.data().name;
      }
    }
    console.log("Fetched department name:", departmentName);

    // 5. Generate unique Certificate ID
    const certificateId = `CERT-${uuidv4().substring(0, 8).toUpperCase()}`;
    const issuedDate = new Date().toISOString();
    console.log("Generated certificate ID and issued date:", { certificateId, issuedDate });

    // 6. Store Certificate Information in Firestore
    const certificateRef = await addDoc(collection(db, "certificates"), {
      certificateId,
      userId,
      studentName,
      courseId,
      courseName,
      teacherId,
      teacherName,
      departmentId: departmentId || null, // Ensure departmentId is null if undefined
      departmentName,
      grade,
      issuedDate,
      pdfUrl: "", // Placeholder for PDF URL, will be updated after PDF generation
      createdAt: serverTimestamp(),
    })
    console.log("Certificate stored in Firestore with ref ID:", certificateRef.id);

    return NextResponse.json({ message: "Certificate details stored successfully", certificateId: certificateRef.id }, { status: 201 })
  } catch (error) {
    console.error("Error generating certificate:", error)
    return NextResponse.json({ message: "Error generating certificate" }, { status: 500 })
  }
}

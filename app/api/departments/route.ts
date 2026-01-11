import { NextResponse } from "next/server"
import { db } from "@/lib/firebase/config"
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { adminAuth } from "@/lib/firebase/auth" // Assuming adminAuth is correctly configured

export async function GET() {
  try {
    // In a real application, you'd want to verify admin privileges here
    // const user = await adminAuth().verifyIdToken(idToken); // Example

    const departmentsCol = collection(db, "departments")
    const departmentsSnapshot = await getDocs(query(departmentsCol, orderBy("name")))
    const departments = departmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return NextResponse.json(departments)
  } catch (error) {
    console.error("Error fetching departments:", error)
    return NextResponse.json({ message: "Error fetching departments" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // In a real application, you'd want to verify admin privileges here
    // const user = await adminAuth().verifyIdToken(idToken); // Example

    const { name, headOfDepartment, contactEmail, description, establishedYear, imageUrl } = await request.json()
    if (!name) {
      return NextResponse.json({ message: "Department name is required" }, { status: 400 })
    }

    const departmentsCol = collection(db, "departments")
    const newDepartmentRef = await addDoc(departmentsCol, {
      name,
      headOfDepartment: headOfDepartment || null,
      contactEmail: contactEmail || null,
      description: description || null,
      establishedYear: establishedYear || null,
      imageUrl: imageUrl || null, // New field
      createdAt: serverTimestamp(),
    })

    return NextResponse.json({ id: newDepartmentRef.id, name, headOfDepartment, contactEmail, description, establishedYear, imageUrl, createdAt: "pending" }, { status: 201 })
  } catch (error) {
    console.error("Error adding department:", error)
    return NextResponse.json({ message: "Error adding department" }, { status: 500 })
  }
}

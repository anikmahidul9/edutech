import { NextResponse } from "next/server"
import { db } from "@/lib/firebase/config"
import { doc, deleteDoc, updateDoc } from "firebase/firestore"
import { adminAuth } from "@/lib/firebase/auth" // Assuming adminAuth is correctly configured

export async function DELETE(request: Request, { params }: { params: { departmentId: string } }) {
  try {
    // In a real application, you'd want to verify admin privileges here
    // const user = await adminAuth().verifyIdToken(idToken); // Example

    const { departmentId } = params
    if (!departmentId) {
      return NextResponse.json({ message: "Department ID is required" }, { status: 400 })
    }

    const departmentDocRef = doc(db, "departments", departmentId)
    await deleteDoc(departmentDocRef)

    return NextResponse.json({ message: "Department deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting department:", error)
    return NextResponse.json({ message: "Error deleting department" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { departmentId: string } }) {
  console.log("API PUT /api/departments/[departmentId] received. Params:", params);
  try {
    // In a real application, you'd want to verify admin privileges here
    // const user = await adminAuth().verifyIdToken(idToken); // Example

    // Extract departmentId directly from the URL pathname
    const urlParts = new URL(request.url).pathname.split('/');
    const departmentId = urlParts[urlParts.length - 1];

    console.log("Extracted departmentId from URL:", departmentId);
    if (!departmentId) {
      return NextResponse.json({ message: "Department ID is required" }, { status: 400 })
    }

    const { name, headOfDepartment, contactEmail, description, establishedYear, imageUrl } = await request.json()

    const departmentDocRef = doc(db, "departments", departmentId)
    await updateDoc(departmentDocRef, {
      name,
      headOfDepartment: headOfDepartment || null,
      contactEmail: contactEmail || null,
      description: description || null,
      establishedYear: establishedYear || null,
      imageUrl: imageUrl || null, // New field
    })

    return NextResponse.json({ message: "Department updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating department:", error)
    return NextResponse.json({ message: "Error updating department" }, { status: 500 })
  }
}

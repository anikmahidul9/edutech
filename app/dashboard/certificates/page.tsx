"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { db } from "@/lib/firebase/config"
import { collection, query, where, getDocs } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Award, Download } from "lucide-react"
import Link from "next/link"

interface Certificate {
  id: string;
  certificateId: string;
  courseName: string;
  issuedDate: string;
  grade: string;
  pdfUrl?: string; // Optional, will be populated after PDF generation
}

export default function CertificatesPage() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchCertificates = async () => {
      try {
        const q = query(collection(db, "certificates"), where("userId", "==", user.uid))
        const querySnapshot = await getDocs(q)
        const fetchedCertificates = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Certificate[]
        setCertificates(fetchedCertificates)
      } catch (err: any) {
        console.error("Error fetching certificates:", err)
        setError(err.message || "Failed to load certificates.")
      } finally {
        setLoading(false)
      }
    }

    fetchCertificates()
  }, [user])

  const handleDownloadPdf = async (certificateId: string) => {
    try {
      const response = await fetch(`/api/certificates/${certificateId}/pdf`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to download certificate.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Certificate downloaded successfully!");

    } catch (err: any) {
      console.error("Error downloading PDF:", err);
      toast.error(err.message || "Failed to download certificate.");
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center">
        <Award className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">Error Loading Certificates</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Certificates</h1>

      {certificates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Award className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No certificates earned yet.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete courses to earn your certificates!
          </p>
          <Button asChild className="mt-6">
            <Link href="/courses">Browse Courses</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="group relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                    {cert.courseName}
                  </CardTitle>
                  <Award className="h-6 w-6 text-yellow-500" />
                </div>
                <p className="text-sm text-muted-foreground">Certificate ID: {cert.certificateId}</p>
                <p className="text-sm text-muted-foreground">Issued: {new Date(cert.issuedDate).toLocaleDateString()}</p>
                <p className="text-sm font-semibold">Grade: {cert.grade}</p>
                <Button size="sm" className="w-full mt-4" onClick={() => handleDownloadPdf(cert.id)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

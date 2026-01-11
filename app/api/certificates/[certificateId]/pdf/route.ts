import { NextResponse } from "next/server"
import { db } from "@/lib/firebase/config"
import { doc, getDoc } from "firebase/firestore"
import puppeteer from 'puppeteer';

export async function GET(request: Request, { params }: { params: { certificateId: string } }) {
  console.log("API GET /api/certificates/[certificateId]/pdf received. Params:", params);
  try {
    // Extract certificateId directly from the URL pathname
    const urlParts = new URL(request.url).pathname.split('/');
    const certificateId = urlParts[urlParts.length - 2];

    console.log("Extracted certificateId from URL:", certificateId);

    if (!certificateId) {
      console.error("Certificate ID is missing from params.");
      return NextResponse.json({ message: "Certificate ID is required" }, { status: 400 })
    }

    // Fetch certificate details from Firestore
    const certificateDoc = await getDoc(doc(db, "certificates", certificateId))
    if (!certificateDoc.exists()) {
      console.error("Certificate not found for ID:", certificateId);
      return NextResponse.json({ message: "Certificate not found" }, { status: 404 })
    }
    const certificateData = certificateDoc.data();
    console.log("Fetched certificate data:", certificateData);

    // Construct HTML with beautiful UI design
    const studentName = certificateData.studentName || "N/A";
    const courseName = certificateData.courseName || "N/A";
    const issuedDate = new Date(certificateData.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const certId = certificateData.certificateId || "N/A";
    const teacherName = certificateData.teacherName || "N/A";
    const department = certificateData.departmentName || "N/A";
    const grade = certificateData.grade || "N/A";

    const certificateHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate of Achievement</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            margin: 0;
            size: A4 landscape;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', sans-serif;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #FFF9E6 0%, #FFF3CD 100%);
            position: relative;
            overflow: hidden;
            width: 297mm;
            height: 210mm;
          }
          
          .certificate-container {
            width: 100%;
            height: 100%;
            border: 15px solid transparent;
            border-image: linear-gradient(45deg, #FFD700, #FFA500, #FFD700) 1;
            position: relative;
            padding: 30px;
            background: white;
          }
          
          /* Corner decorations */
          .corner-decoration {
            position: absolute;
            width: 50px;
            height: 50px;
            border-width: 3px;
            border-style: solid;
            border-image: linear-gradient(45deg, #FFD700, #FFA500) 1;
          }
          
          .corner-tl {
            top: -15px;
            left: -15px;
            border-right: none;
            border-bottom: none;
          }
          
          .corner-tr {
            top: -15px;
            right: -15px;
            border-left: none;
            border-bottom: none;
          }
          
          .corner-bl {
            bottom: -15px;
            left: -15px;
            border-right: none;
            border-top: none;
          }
          
          .corner-br {
            bottom: -15px;
            right: -15px;
            border-left: none;
            border-top: none;
          }
          
          /* Watermark patterns */
          .watermark {
            position: absolute;
            opacity: 0.03;
            z-index: 1;
          }
          
          .watermark-1 {
            top: 10%;
            left: 5%;
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, #FFD700 0%, transparent 70%);
          }
          
          .watermark-2 {
            bottom: 10%;
            right: 5%;
            width: 150px;
            height: 150px;
            background: radial-gradient(circle, #FFA500 0%, transparent 70%);
          }
          
          /* Header section */
          .header {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
          }
          
          .header-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            border-radius: 50%;
            margin: 0 auto 15px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 5px 15px rgba(255, 165, 0, 0.2);
          }
          
          .header-icon::after {
            content: "🏆";
            font-size: 40px;
          }
          
          .title {
            font-family: 'Playfair Display', serif;
            font-size: 32px;
            font-weight: 900;
            background: linear-gradient(45deg, #8B4513, #D2691E, #8B4513);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
          }
          
          .subtitle {
            font-size: 16px;
            color: #8B4513;
            opacity: 0.8;
            letter-spacing: 1px;
            font-weight: 500;
          }
          
          /* Student name section */
          .student-section {
            text-align: center;
            margin-bottom: 25px;
            position: relative;
            z-index: 2;
          }
          
          .student-name {
            font-family: 'Playfair Display', serif;
            font-size: 48px;
            font-weight: 700;
            color: #8B4513;
            margin-bottom: 15px;
            line-height: 1.1;
            padding: 0 10px;
          }
          
          .name-underline {
            width: 350px;
            height: 3px;
            background: linear-gradient(90deg, transparent, #FFD700, #FFA500, #FFD700, transparent);
            margin: 0 auto;
            border-radius: 2px;
          }
          
          /* Course details */
          .course-section {
            text-align: center;
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
          }
          
          .course-intro {
            font-size: 18px;
            color: #8B4513;
            margin-bottom: 10px;
            font-weight: 500;
          }
          
          .course-name {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            color: #8B4513;
            font-weight: 700;
            font-style: italic;
            margin-bottom: 30px;
            padding: 0 20px;
            line-height: 1.2;
          }
          
          /* Badges section */
          .badges-container {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 40px;
            position: relative;
            z-index: 2;
          }
          
          .badge {
            padding: 12px 20px;
            border: 2px solid #FFD700;
            border-radius: 12px;
            background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 165, 0, 0.1));
            min-width: 160px;
            text-align: center;
          }
          
          .badge-label {
            font-size: 14px;
            color: #8B4513;
            opacity: 0.8;
            margin-bottom: 5px;
            font-weight: 500;
          }
          
          .badge-value {
            font-size: 18px;
            font-weight: 700;
            color: #8B4513;
          }
          
          /* Signatures section */
          .signatures-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            position: relative;
            z-index: 2;
            padding: 0 20px;
          }
          
          .signature-block {
            text-align: center;
            flex: 1;
          }
          
          .signature-line {
            width: 180px;
            height: 2px;
            background: linear-gradient(90deg, transparent, #8B4513, transparent);
            margin: 15px auto;
          }
          
          .signature-name {
            font-size: 20px;
            font-weight: 700;
            color: #8B4513;
            margin-bottom: 5px;
            font-family: 'Playfair Display', serif;
          }
          
          .signature-role {
            font-size: 14px;
            color: #8B4513;
            opacity: 0.7;
            font-weight: 500;
          }
          
          /* Footer seal */
          .seal-container {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2;
          }
          
          .seal {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 5px 15px rgba(255, 165, 0, 0.3);
          }
          
          .seal-content {
            font-family: 'Playfair Display', serif;
            font-size: 12px;
            color: #8B4513;
            font-weight: 900;
            text-align: center;
            line-height: 1.3;
            text-transform: uppercase;
          }
          
          /* Certificate ID */
          .certificate-id {
            position: absolute;
            bottom: 20px;
            right: 30px;
            font-size: 14px;
            color: #8B4513;
            opacity: 0.6;
            font-family: 'Courier New', monospace;
            font-weight: 600;
            z-index: 2;
          }
          
          /* Border lines */
          .border-line-top {
            position: absolute;
            top: 5px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            height: 1px;
            background: linear-gradient(90deg, transparent, #FFD700, transparent);
          }
          
          .border-line-bottom {
            position: absolute;
            bottom: 5px;
            left: 50%;
            transform: translateX(-50%);
            width: 90%;
            height: 1px;
            background: linear-gradient(90deg, transparent, #FFD700, transparent);
          }
          
          /* Compact layout adjustments */
          .compact-spacing {
            margin-top: 10px;
          }
          
          .vertical-space {
            height: 15px;
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <!-- Corner decorations -->
          <div class="corner-decoration corner-tl"></div>
          <div class="corner-decoration corner-tr"></div>
          <div class="corner-decoration corner-bl"></div>
          <div class="corner-decoration corner-br"></div>
          
          <!-- Border lines -->
          <div class="border-line-top"></div>
          <div class="border-line-bottom"></div>
          
          <!-- Watermark patterns -->
          <div class="watermark watermark-1"></div>
          <div class="watermark watermark-2"></div>
          
          <!-- Header -->
          <div class="header">
            <div class="header-icon"></div>
            <h1 class="title">CERTIFICATE OF ACHIEVEMENT</h1>
            <p class="subtitle">This certificate is proudly presented to</p>
          </div>
          
          <!-- Student Name -->
          <div class="student-section">
            <h2 class="student-name">${studentName}</h2>
            <div class="name-underline"></div>
          </div>
          
          <!-- Course Details -->
          <div class="course-section">
            <p class="course-intro">has successfully completed the course</p>
            <h3 class="course-name">"${courseName}"</h3>
          </div>
          
          <div class="vertical-space"></div>
          
          <!-- Badges -->
          <div class="badges-container">
            <div class="badge">
              <div class="badge-label">Department</div>
              <div class="badge-value">${department}</div>
            </div>
            <div class="badge">
              <div class="badge-label">Grade</div>
              <div class="badge-value">${grade}</div>
            </div>
            <div class="badge">
              <div class="badge-label">Certificate ID</div>
              <div class="badge-value">${certId}</div>
            </div>
          </div>
          
          <!-- Signatures -->
          <div class="signatures-section compact-spacing">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-name">${teacherName}</div>
              <div class="signature-role">Course Instructor</div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-name">${issuedDate}</div>
              <div class="signature-role">Date of Issuance</div>
            </div>
          </div>
          
          <!-- Seal -->
          <div class="seal-container">
            <div class="seal">
              <div class="seal-content">
                VERIFIED<br>ACHIEVEMENT
              </div>
            </div>
          </div>
          
          <!-- Certificate ID -->
          <div class="certificate-id">ID: ${certId}</div>
        </div>
      </body>
      </html>
    `;

    // Launch Puppeteer and generate PDF
    console.log("Attempting to launch Puppeteer browser...");
    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ] 
    });
    console.log("Puppeteer browser launched.");

    console.log("Attempting to create new page...");
    const page = await browser.newPage();
    console.log("New page created.");

    // Set a more reasonable viewport
    await page.setViewport({ width: 1920, height: 1080 });

    console.log("Attempting to set HTML content...");
    await page.setContent(certificateHtml, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    console.log("HTML content set.");

    console.log("Attempting to generate PDF...");
    const pdfBuffer = await page.pdf({ 
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '10px',
        right: '10px',
        bottom: '10px',
        left: '10px'
      }
    });
    console.log("PDF generated.");

    console.log("Attempting to close browser...");
    await browser.close();
    console.log("Browser closed.");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certId}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error("Error generating PDF certificate:", error)
    return NextResponse.json({ 
      message: "Error generating PDF certificate",
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
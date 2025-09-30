import { type NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"
import { renderToStaticMarkup } from "react-dom/server"
import { DiplomaTemplate } from "@/components/diploma-template"
import JSZip from "jszip"

interface Student {
  nom_etudiant: string
  specialite: string
  date_obtention: string
}

interface RequestBody {
  lot_nom: string
  etudiants: Student[]
  template_type?: "bep" | "bp" | "bt"
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { lot_nom, etudiants, template_type = "bep" } = body

    if (!lot_nom || !etudiants || !Array.isArray(etudiants)) {
      return NextResponse.json({ error: "Format de données invalide" }, { status: 400 })
    }

    // Launch browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const zip = new JSZip()
    const pdfFolder = zip.folder(lot_nom)

    // Generate PDF for each student
    for (let i = 0; i < etudiants.length; i++) {
      const etudiant = etudiants[i]

      const html = renderToStaticMarkup(
        <DiplomaTemplate
          nom_etudiant={etudiant.nom_etudiant}
          specialite={etudiant.specialite}
          date_obtention={etudiant.date_obtention}
          templateType={template_type}
        />,
      )

      // Create full HTML document
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: Arial, Helvetica, sans-serif;
                padding: 40px;
                background: white;
              }
              @page {
                size: A4 portrait;
                margin: 20mm;
              }
            </style>
          </head>
          <body>
            ${html}
          </body>
        </html>
      `

      // Generate PDF
      const page = await browser.newPage()
      await page.setContent(fullHtml, { waitUntil: "networkidle0" })
      const pdfBuffer = await page.pdf({
        format: "A4",
        landscape: false,
        printBackground: true,
        margin: {
          top: "20mm",
          right: "20mm",
          bottom: "20mm",
          left: "20mm",
        },
      })
      await page.close()

      // Add to ZIP
      const fileName = `${etudiant.nom_etudiant.replace(/\s+/g, "_")}_diplome.pdf`
      pdfFolder?.file(fileName, pdfBuffer)
    }

    await browser.close()

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // Return ZIP file
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${lot_nom}_diplomes.zip"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error generating diplomas:", error)
    return NextResponse.json({ error: "Erreur lors de la génération des diplômes" }, { status: 500 })
  }
}

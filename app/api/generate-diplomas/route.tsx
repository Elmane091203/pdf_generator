import { type NextRequest, NextResponse } from "next/server"
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"
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
  download_mode?: "zip" | "individual"
}

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  // BEP & BT styles
  bepContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  bepTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    marginTop: 21.47,
    marginBottom: 21.47,
  },
  bepText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 18,
    marginBottom: 18,
  },
  bepStudentName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  bepSpecialite: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  bepFooter: {
    marginTop: 40,
    marginHorizontal: 20,
    fontSize: 12,
    textAlign: "left",
  },
  // BP styles
  bpPage: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  bpContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    border: "2pt solid #000000",
    padding: 40,
  },
  bpTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    textTransform: "uppercase",
    marginBottom: 20,
  },
  bpText: {
    fontSize: 18,
    textAlign: "center",
    marginVertical: 10,
  },
  bpStudentName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    marginVertical: 20,
  },
  bpSpecialite: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#003366",
    textAlign: "center",
    marginVertical: 20,
  },
  bpFooter: {
    marginTop: 60,
    fontSize: 12,
    textAlign: "center",
  },
})

// BEP Template Component
function BEPDocument({ nom_etudiant, specialite, date_obtention }: Student) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.bepContainer}>
          <Text style={styles.bepTitle}>Brevet d'Etudes Professionnel</Text>
          <Text style={styles.bepText}>Ce diplôme est décerné à Mr</Text>
          <Text style={styles.bepStudentName}>{nom_etudiant}</Text>
          <Text style={styles.bepText}>pour avoir satisfait aux exigences du programme</Text>
          <Text style={styles.bepSpecialite}>{specialite}</Text>
          <Text style={styles.bepText}>et avoir démontré les compétences requises pour l'obtention de ce diplôme.</Text>
          <View style={{ marginTop: 18, marginBottom: 18 }}>
            <Text style={styles.bepText}> </Text>
          </View>
          <Text style={styles.bepFooter}>
            {"                    "}
            <Text style={{ fontWeight: "bold" }}>Date de délivrance : </Text>
            {date_obtention}
            {"                                        "}
            <Text style={{ fontWeight: "bold" }}>Signature : </Text>
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// BP Template Component
function BPDocument({ nom_etudiant, specialite, date_obtention }: Student) {
  return (
    <Document>
      <Page size="A4" style={styles.bpPage}>
        <View style={styles.bpContainer}>
          <Text style={styles.bpTitle}>Brevet Professionnel</Text>
          <Text style={styles.bpText}>Ce diplôme est décerné à</Text>
          <Text style={styles.bpStudentName}>{nom_etudiant}</Text>
          <Text style={styles.bpText}>pour avoir satisfait aux exigences du programme</Text>
          <Text style={styles.bpSpecialite}>{specialite}</Text>
          <Text style={styles.bpText}>et avoir démontré les compétences requises pour l'obtention de ce diplôme.</Text>
          <Text style={styles.bpFooter}>
            <Text style={{ fontWeight: "bold" }}>Date de délivrance : </Text>
            {date_obtention}
            {"        "}
            <Text style={{ fontWeight: "bold" }}>Signature : </Text>
            __________
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// BT Template Component
function BTDocument({ nom_etudiant, specialite, date_obtention }: Student) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.bepContainer}>
          <Text style={styles.bepTitle}>Brevet de Technicien</Text>
          <Text style={styles.bepText}>Ce diplôme est décerné à Mr</Text>
          <Text style={styles.bepStudentName}>{nom_etudiant}</Text>
          <Text style={styles.bepText}>pour avoir satisfait aux exigences du programme</Text>
          <Text style={styles.bepSpecialite}>{specialite}</Text>
          <Text style={styles.bepText}>et avoir démontré les compétences requises pour l'obtention de ce diplôme.</Text>
          <View style={{ marginTop: 18, marginBottom: 18 }}>
            <Text style={styles.bepText}> </Text>
          </View>
          <Text style={styles.bepFooter}>
            {"                    "}
            <Text style={{ fontWeight: "bold" }}>Date de délivrance : </Text>
            {date_obtention}
            {"                                        "}
            <Text style={{ fontWeight: "bold" }}>Signature : </Text>
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { lot_nom, etudiants, template_type = "bep", download_mode = "zip" } = body

    if (!lot_nom || !etudiants || !Array.isArray(etudiants)) {
      return NextResponse.json({ error: "Format de données invalide" }, { status: 400 })
    }

    if (download_mode === "individual") {
      const pdfs = []

      for (let i = 0; i < etudiants.length; i++) {
        const etudiant = etudiants[i]

        let document
        if (template_type === "bp") {
          document = <BPDocument {...etudiant} />
        } else if (template_type === "bt") {
          document = <BTDocument {...etudiant} />
        } else {
          document = <BEPDocument {...etudiant} />
        }

        const pdfBuffer = await pdf(document).toBuffer()
        const fileName = `${etudiant.nom_etudiant.replace(/\s+/g, "_")}_diplome.pdf`

        pdfs.push({
          filename: fileName,
          data: pdfBuffer.toString("base64"),
        })
      }

      return NextResponse.json({ pdfs })
    }

    const zip = new JSZip()
    const pdfFolder = zip.folder(lot_nom)

    // Generate PDF for each student
    for (let i = 0; i < etudiants.length; i++) {
      const etudiant = etudiants[i]

      // Select template based on type
      let document
      if (template_type === "bp") {
        document = <BPDocument {...etudiant} />
      } else if (template_type === "bt") {
        document = <BTDocument {...etudiant} />
      } else {
        document = <BEPDocument {...etudiant} />
      }

      // Generate PDF buffer
      const pdfBuffer = await pdf(document).toBuffer()

      // Add to ZIP
      const fileName = `${etudiant.nom_etudiant.replace(/\s+/g, "_")}_diplome.pdf`
      pdfFolder?.file(fileName, pdfBuffer)
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

    // Return ZIP file
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${lot_nom}_diplomes.zip"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error generating diplomas:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la génération des diplômes",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

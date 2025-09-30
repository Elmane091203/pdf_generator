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
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 40,
    marginHorizontal: 20,
    fontSize: 12,
  },
  bepFooterText: {
    fontSize: 12,
  },
  bepFooterBold: {
    fontSize: 12,
    fontWeight: "bold",
  },
  // BP styles
  bpContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    border: "2pt solid #000000",
    margin: 40,
    padding: 30,
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
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    marginTop: 60,
    fontSize: 12,
  },
  bpFooterItem: {
    flexDirection: "row",
  },
  bpFooterBold: {
    fontSize: 12,
    fontWeight: "bold",
  },
  bpFooterText: {
    fontSize: 12,
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
          <View style={styles.bepFooter}>
            <Text style={styles.bepFooterText}>
              <Text style={styles.bepFooterBold}>Date de délivrance : </Text>
              {date_obtention}
            </Text>
            <Text style={styles.bepFooterBold}>Signature :</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

// BP Template Component
function BPDocument({ nom_etudiant, specialite, date_obtention }: Student) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.bpContainer}>
          <Text style={styles.bpTitle}>Brevet Professionnel</Text>
          <Text style={styles.bpText}>Ce diplôme est décerné à</Text>
          <Text style={styles.bpStudentName}>{nom_etudiant}</Text>
          <Text style={styles.bpText}>pour avoir satisfait aux exigences du programme</Text>
          <Text style={styles.bpSpecialite}>{specialite}</Text>
          <Text style={styles.bpText}>et avoir démontré les compétences requises pour l'obtention de ce diplôme.</Text>
          <View style={styles.bpFooter}>
            <View style={styles.bpFooterItem}>
              <Text style={styles.bpFooterBold}>Date de délivrance : </Text>
              <Text style={styles.bpFooterText}>{date_obtention}</Text>
            </View>
            <View style={styles.bpFooterItem}>
              <Text style={styles.bpFooterBold}>Signature : </Text>
              <Text style={styles.bpFooterText}>__________</Text>
            </View>
          </View>
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
          <View style={styles.bepFooter}>
            <Text style={styles.bepFooterText}>
              <Text style={styles.bepFooterBold}>Date de délivrance : </Text>
              {date_obtention}
            </Text>
            <Text style={styles.bepFooterBold}>Signature :</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { lot_nom, etudiants, template_type = "bep" } = body

    if (!lot_nom || !etudiants || !Array.isArray(etudiants)) {
      return NextResponse.json({ error: "Format de données invalide" }, { status: 400 })
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

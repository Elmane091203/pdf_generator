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
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 20,
    textAlign: "center",
  },
  text: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
  },
  studentName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
    marginVertical: 15,
    textAlign: "center",
  },
  specialite: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003366",
    marginVertical: 15,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 60,
    paddingHorizontal: 40,
  },
  footerText: {
    fontSize: 12,
  },
  footerBold: {
    fontSize: 12,
    fontWeight: "bold",
  },
  bpContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    border: "2pt solid #000000",
    margin: 20,
    padding: 20,
  },
  bpTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 20,
    textAlign: "center",
    textTransform: "uppercase",
  },
})

// BEP Template Component
function BEPDocument({ nom_etudiant, specialite, date_obtention }: Student) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          <Text style={styles.title}>Brevet d'Etudes Professionnel</Text>
          <Text style={styles.text}>Ce diplôme est décerné à Mr</Text>
          <Text style={styles.studentName}>{nom_etudiant}</Text>
          <Text style={styles.text}>pour avoir satisfait aux exigences du programme</Text>
          <Text style={styles.specialite}>{specialite}</Text>
          <Text style={styles.text}>et avoir démontré les compétences requises pour l'obtention de ce diplôme.</Text>
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerBold}>
                Date de délivrance : {new Date(date_obtention).toLocaleDateString("fr-FR")}
              </Text>
            </View>
            <View>
              <Text style={styles.footerBold}>Signature :</Text>
            </View>
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
          <Text style={styles.text}>Ce diplôme est décerné à</Text>
          <Text style={styles.studentName}>{nom_etudiant}</Text>
          <Text style={styles.text}>pour avoir satisfait aux exigences du programme</Text>
          <Text style={styles.specialite}>{specialite}</Text>
          <Text style={styles.text}>et avoir démontré les compétences requises pour l'obtention de ce diplôme.</Text>
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerBold}>
                Date de délivrance : {new Date(date_obtention).toLocaleDateString("fr-FR")}
              </Text>
            </View>
            <View>
              <Text style={styles.footerBold}>Signature : </Text>
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
        <View style={styles.container}>
          <Text style={styles.title}>Brevet de Technicien</Text>
          <Text style={styles.text}>Ce diplôme est décerné à Mr</Text>
          <Text style={styles.studentName}>{nom_etudiant}</Text>
          <Text style={styles.text}>pour avoir satisfait aux exigences du programme</Text>
          <Text style={styles.specialite}>{specialite}</Text>
          <Text style={styles.text}>et avoir démontré les compétences requises pour l'obtention de ce diplôme.</Text>
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerBold}>
                Date de délivrance : {new Date(date_obtention).toLocaleDateString("fr-FR")}
              </Text>
            </View>
            <View>
              <Text style={styles.footerBold}>Signature :</Text>
            </View>
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

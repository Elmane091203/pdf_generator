import { type NextRequest, NextResponse } from "next/server"
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer"
import { DocuSealClient, SignatureField } from "@/lib/docuseal"

interface Student {
  nom_etudiant: string
  specialite: string
  date_obtention: string
}

interface RequestBody {
  lot_nom: string
  etudiants: Student[]
  template_type?: "bep" | "bp" | "bt"
  signer_email: string
  signature_position?: {
    x: number
    y: number
    width: number
    height: number
    page: number
  }
}

// Define styles for PDF (same as original)
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
    const { 
      lot_nom, 
      etudiants, 
      template_type = "bep", 
      signer_email,
      signature_position 
    } = body

    if (!lot_nom || !etudiants || !Array.isArray(etudiants) || !signer_email) {
      return NextResponse.json({ 
        error: "Format de données invalide. lot_nom, etudiants et signer_email sont requis." 
      }, { status: 400 })
    }

    // Vérifier la configuration DocuSeal
    const docusealApiKey = process.env.DOCUSEAL_API_KEY || "1A8v6xC5DHW43cehcfJbjPXZbek1ngvaKn2U9q5rVrc"
    const docusealBaseUrl = process.env.DOCUSEAL_BASE_URL || 'https://firndebi.mosikasign.com'

    if (!docusealApiKey) {
      return NextResponse.json({ 
        error: "Configuration DocuSeal manquante. DOCUSEAL_API_KEY requis." 
      }, { status: 500 })
    }

    // Générer les PDFs pour tous les étudiants
    const pdfBuffers = []
    
    for (let i = 0; i < etudiants.length; i++) {
      const etudiant = etudiants[i]
      
      // Sélectionner le template basé sur le type
      let DocumentComponent
      if (template_type === "bp") {
        DocumentComponent = BPDocument
      } else if (template_type === "bt") {
        DocumentComponent = BTDocument
      } else {
        DocumentComponent = BEPDocument
      }

      // Générer le PDF
      const pdfDoc = pdf(<DocumentComponent {...etudiant} />)
      const pdfBlob = await pdfDoc.toBlob()
      const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer())
      
      const fileName = `${etudiant.nom_etudiant.replace(/\s+/g, "_")}_diplome.pdf`
      pdfBuffers.push({
        buffer: pdfBuffer,
        filename: fileName
      })
    }

    // Configuration du champ signature
    const signatureField: SignatureField = {
      x: signature_position?.x ?? 0.75, // Position par défaut à droite du texte "Signature :"
      y: signature_position?.y ?? 0.85, // Position par défaut en bas de page
      width: signature_position?.width ?? 0.15,
      height: signature_position?.height ?? 0.08,
      page: signature_position?.page ?? 0,
    }

    // Créer le client DocuSeal
    const docusealClient = new DocuSealClient(docusealApiKey, docusealBaseUrl)

    // Créer le template avec tous les diplômes et signature
    const templateName = `Diplômes ${template_type.toUpperCase()} - ${lot_nom}`
    const result = await docusealClient.createMultiDocumentTemplateWithSubmission(
      pdfBuffers,
      templateName,
      signatureField,
      signer_email,
      false // Ne pas envoyer d'email automatiquement
    )

    return NextResponse.json({
      success: true,
      templateId: result.templateId,
      templateSlug: result.templateSlug,
      signUrl: result.signUrl,
      submissionId: result.submissionId,
      message: `Template créé avec succès pour ${etudiants.length} diplôme(s).`
    })

  } catch (error) {
    console.error("[DocuSeal] Error generating multi-diploma template:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création du template avec signature",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

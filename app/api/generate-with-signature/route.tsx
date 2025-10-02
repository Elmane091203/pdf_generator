import { type NextRequest, NextResponse } from "next/server";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { DocuSealClient, SignatureField } from "@/lib/docuseal";

interface Student {
  nom_etudiant: string;
  specialite: string;
  date_obtention: string;
}

interface RequestBody {
  lot_nom: string;
  etudiants: Student[];
  template_type?: "bep" | "bp" | "bt";
  signer_email: string;
  signature_position?: {
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
  };
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
});

// BEP Template Component
function BEPDocument({ nom_etudiant, specialite, date_obtention }: Student) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.bepContainer}>
          <Text style={styles.bepTitle}>Brevet d'Etudes Professionnel</Text>
          <Text style={styles.bepText}>Ce diplôme est décerné à Mr</Text>
          <Text style={styles.bepStudentName}>{nom_etudiant}</Text>
          <Text style={styles.bepText}>
            pour avoir satisfait aux exigences du programme
          </Text>
          <Text style={styles.bepSpecialite}>{specialite}</Text>
          <Text style={styles.bepText}>
            et avoir démontré les compétences requises pour l'obtention de ce
            diplôme.
          </Text>
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
  );
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
          <Text style={styles.bpText}>
            pour avoir satisfait aux exigences du programme
          </Text>
          <Text style={styles.bpSpecialite}>{specialite}</Text>
          <Text style={styles.bpText}>
            et avoir démontré les compétences requises pour l'obtention de ce
            diplôme.
          </Text>
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
  );
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
          <Text style={styles.bepText}>
            pour avoir satisfait aux exigences du programme
          </Text>
          <Text style={styles.bepSpecialite}>{specialite}</Text>
          <Text style={styles.bepText}>
            et avoir démontré les compétences requises pour l'obtention de ce
            diplôme.
          </Text>
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
  );
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const {
      lot_nom,
      etudiants,
      template_type = "bep",
      signer_email,
      signature_position,
    } = body;

    if (!lot_nom || !etudiants || !Array.isArray(etudiants) || !signer_email) {
      return NextResponse.json(
        {
          error:
            "Format de données invalide. lot_nom, etudiants et signer_email sont requis.",
        },
        { status: 400 }
      );
    }

    // Vérifier la configuration DocuSeal
    const docusealApiKey = process.env.DOCUSEAL_API_KEY ||"CPMhp5phGMMU3wrXsoBRezBS5cDRyPd3c1k8ipJ5vkq";
    const docusealBaseUrl =
      process.env.DOCUSEAL_BASE_URL || "http://localhost:57023";

    if (!docusealApiKey) {
      return NextResponse.json(
        {
          error: "Configuration DocuSeal manquante. DOCUSEAL_API_KEY requis.",
        },
        { status: 500 }
      );
    }

    // Générer le PDF pour le premier étudiant (template de base)
    const firstStudent = etudiants[0];
    let document;

    if (template_type === "bp") {
      document = <BPDocument {...firstStudent} />;
    } else if (template_type === "bt") {
      document = <BTDocument {...firstStudent} />;
    } else {
      document = <BEPDocument {...firstStudent} />;
    }

    // Générer le PDF buffer
    const pdfDoc = pdf(document);
    const pdfBlob = await pdfDoc.toBlob();
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Configuration du champ signature
    const signatureField: SignatureField = {
      x: signature_position?.x ?? 0.75, // Position par défaut à droite du texte "Signature :"
      y: signature_position?.y ?? 0.85, // Position par défaut en bas de page
      width: signature_position?.width ?? 0.15,
      height: signature_position?.height ?? 0.08,
      page: signature_position?.page ?? 0,
    };

    // Créer le client DocuSeal
    const docusealClient = new DocuSealClient(docusealApiKey, docusealBaseUrl);

    // Créer le template avec signature
    const templateName = `Diplôme ${template_type.toUpperCase()} - ${lot_nom}`;
    const result = await docusealClient.createTemplateFromPDF(
      pdfBuffer,
      `${templateName}.pdf`,
      templateName,
      signatureField,
      signer_email
    );

    return NextResponse.json({
      success: true,
      templateId: result.templateId,
      templateSlug: result.templateSlug,
      signUrl: result.signUrl,
      submissionId: result.submissionId,
      message: `Template créé avec succès pour ${etudiants.length} étudiant(s).`,
    });
  } catch (error) {
    console.error("[DocuSeal] Error generating template:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création du template avec signature",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

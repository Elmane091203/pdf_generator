import { type NextRequest, NextResponse } from "next/server"
import { DocuSealClient } from "@/lib/docuseal"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const submissionId = Number.parseInt(params.id)

    const docusealApiKey = process.env.DOCUSEAL_API_KEY
    const docusealBaseUrl = process.env.DOCUSEAL_BASE_URL || "http://localhost:3000"

    if (!docusealApiKey) {
      return NextResponse.json(
        {
          error: "Configuration DocuSeal manquante.",
        },
        { status: 500 },
      )
    }

    const docusealClient = new DocuSealClient(docusealApiKey, docusealBaseUrl)
    const documents = await docusealClient.getSubmissionDocuments(submissionId)

    return NextResponse.json({
      success: true,
      documents,
    })
  } catch (error) {
    console.error("[DocuSeal] Error fetching documents:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des documents",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

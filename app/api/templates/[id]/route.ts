import { type NextRequest, NextResponse } from "next/server"
import { DocuSealClient } from "@/lib/docuseal"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = Number.parseInt(params.id)

    const docusealApiKey = process.env.DOCUSEAL_API_KEY
    const docusealBaseUrl = process.env.DOCUSEAL_BASE_URL || "https://firndebi.mosikasign.com"

    if (!docusealApiKey) {
      return NextResponse.json(
        {
          error: "Configuration DocuSeal manquante.",
        },
        { status: 500 },
      )
    }

    const docusealClient = new DocuSealClient(docusealApiKey, docusealBaseUrl)
    const template = await docusealClient.getTemplate(templateId)

    return NextResponse.json({
      success: true,
      template,
    })
  } catch (error) {
    console.error("[DocuSeal] Error fetching template:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération du template",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

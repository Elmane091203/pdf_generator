import { type NextRequest, NextResponse } from "next/server"
import { DocuSealClient } from "@/lib/docuseal"

interface RequestBody {
  email: string
  send_email?: boolean
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const templateId = Number.parseInt(params.id)
    const body: RequestBody = await request.json()
    const { email, send_email = false } = body

    if (!email) {
      return NextResponse.json(
        {
          error: "Email requis pour créer une soumission.",
        },
        { status: 400 },
      )
    }

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
    const submission = await docusealClient.createSubmissionForTemplate(templateId, email, send_email)

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      signUrl: submission.url,
      message: send_email ? `Email de signature envoyé à ${email}` : `Lien de signature créé pour ${email}`,
    })
  } catch (error) {
    console.error("[DocuSeal] Error creating submission:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création de la soumission",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

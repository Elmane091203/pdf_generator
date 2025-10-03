export interface SignatureField {
  x: number // Position X normalisée (0-1)
  y: number // Position Y normalisée (0-1)
  width: number // Largeur normalisée (0-1)
  height: number // Hauteur normalisée (0-1)
  page: number // Numéro de page (0-indexed)
}

export interface DocuSealTemplate {
  id: number
  name: string
  slug?: string
  fields?: any[]
  documents?: any[]
  schema?: any[]
}

export interface DocuSealSubmission {
  id: number
  url: string
  submission_id: number
}

export class DocuSealClient {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl = "http://localhost:3000") {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  private getHeaders() {
    return {
      "X-Auth-Token": this.apiKey,
      "Content-Type": "application/json",
    }
  }

  async createTemplateWithSignature(
    pdfBuffer: Buffer,
    filename: string,
    templateName: string,
    signatureField: SignatureField,
  ): Promise<DocuSealTemplate> {
    // Encoder le PDF en base64
    const encodedPdf = pdfBuffer.toString("base64")

    // Créer le template avec le document
    const templateData = {
      name: templateName,
      documents: [
        {
          file: encodedPdf,
          filename: filename,
          content_type: "application/pdf",
        },
      ],
    }

    const response = await fetch(`${this.baseUrl}/api/templates`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(templateData),
    })

    if (!response.ok) {
      throw new Error(`Erreur création template: ${await response.text()}`)
    }

    const template = await response.json()

    await this.waitForTemplateProcessing(template.id, 1)

    // Ajouter le champ de signature
    await this.addSignatureField(template.id, signatureField)

    return template
  }

  async createMultiDocumentTemplate(
    pdfBuffers: Array<{ buffer: Buffer; filename: string }>,
    templateName: string,
    signatureField: SignatureField,
  ): Promise<DocuSealTemplate> {
    console.log(
      "[DocuSeal] Encoding documents:",
      pdfBuffers.map((p) => ({ filename: p.filename, size: p.buffer.length })),
    )

    // Encoder tous les PDFs en base64
    const documents = pdfBuffers.map(({ buffer, filename }) => ({
      file: buffer.toString("base64"),
      filename: filename,
      content_type: "application/pdf",
    }))

    console.log(
      "[DocuSeal] Base64 encoded sizes:",
      documents.map((d) => ({ filename: d.filename, b64_length: d.file.length })),
    )

    // Créer le template avec tous les documents
    const templateData = {
      name: templateName,
      documents: documents,
    }

    const response = await fetch(`${this.baseUrl}/api/templates`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(templateData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[DocuSeal] Template creation failed:", errorText)
      throw new Error(`Erreur création template: ${errorText}`)
    }

    const template = await response.json()
    console.log(`[DocuSeal] Template created: ID=${template.id}, Slug=${template.slug}`)

    await this.waitForTemplateProcessing(template.id, pdfBuffers.length)

    // Récupérer le template avec les attachment_uuids
    const processedTemplate = await this.getTemplate(template.id)
    console.log(`[DocuSeal] Template processed: Documents=${processedTemplate.schema?.length || 0}`)

    const attachmentUuids = await this.deriveAttachmentUuids(template.id, processedTemplate)
    console.log(`[DocuSeal] Derived attachment UUIDs: ${attachmentUuids.length}`)

    // Ajouter le champ de signature avec multi-areas (une zone par document)
    await this.addMultiAreaSignatureField(template.id, signatureField, attachmentUuids)

    return processedTemplate
  }

  async createMultiDocumentTemplateWithSubmission(
    pdfBuffers: Array<{ buffer: Buffer; filename: string }>,
    templateName: string,
    signatureField: SignatureField,
    signerEmail: string,
    sendEmail = false,
  ) {
    // 1. Créer le template avec tous les PDFs
    const template = await this.createMultiDocumentTemplate(pdfBuffers, templateName, signatureField)

    // 2. Créer la soumission
    const submission = await this.createSubmissionForTemplate(template.id, signerEmail, sendEmail)

    return {
      templateId: template.id,
      templateSlug: template.slug,
      signUrl: submission.url,
      submissionId: submission.id,
      submission_id: submission.submission_id,
    }
  }

  async createTemplateFromPDF(
    pdfBuffer: Buffer,
    filename: string,
    templateName: string,
    signatureField: SignatureField,
    signerEmail: string,
  ) {
    // 1. Créer le template avec le PDF
    const template = await this.createTemplateWithSignature(pdfBuffer, filename, templateName, signatureField)

    // 2. Créer la soumission
    const submission = await this.createSubmission(template.id, signerEmail)

    return {
      templateId: template.id,
      templateSlug: template.slug,
      signUrl: submission.url,
      submissionId: submission.id,
      submission_id: submission.submission_id,
    }
  }

  private async waitForTemplateProcessing(templateId: number, expectedDocumentsCount: number, timeout = 30000) {
    const startTime = Date.now()
    let interval = 500
    const maxInterval = 5000

    console.log(`[DocuSeal] Waiting for template ${templateId} to process ${expectedDocumentsCount} document(s)...`)

    while (Date.now() - startTime < timeout) {
      try {
        const template = await this.getTemplate(templateId)

        console.log(`[DocuSeal] Template ${templateId} status:`, {
          documentsCount: template.documents?.length || 0,
          schemaCount: template.schema?.length || 0,
          hasDocuments: !!template.documents,
          hasSchema: !!template.schema,
        })

        // Check documents array for preview or metadata
        const docs = Array.isArray(template.documents) ? template.documents : []
        const schemaLen = Array.isArray(template.schema) ? template.schema.length : 0

        if (docs.length > 0) {
          docs.forEach((d: any, idx: number) => {
            console.log(`[DocuSeal] Document ${idx}:`, {
              hasPreview: !!d.preview_image_url,
              hasMetadata: !!d.metadata,
              hasPdfMetadata: !!d.metadata?.pdf,
              pageCount: d.metadata?.pdf?.number_of_pages,
            })
          })
        }

        // Check if documents have preview_image_url or metadata
        const docsHavePreviewOrMetadata =
          docs.length >= expectedDocumentsCount &&
          docs.every((d: any) => {
            if (d.preview_image_url) return true
            if (d.metadata && d.metadata.pdf && d.metadata.pdf.number_of_pages) return true
            return false
          })

        // Check if schema has attachment_uuids
        const schemaHasAttachments =
          schemaLen >= expectedDocumentsCount && template.schema.every((s: any) => s.attachment_uuid)

        console.log(`[DocuSeal] Conditions:`, {
          docsHavePreviewOrMetadata,
          schemaHasAttachments,
          docsLength: docs.length,
          schemaLength: schemaLen,
          expectedCount: expectedDocumentsCount,
        })

        if (docsHavePreviewOrMetadata || schemaHasAttachments) {
          console.log(`[DocuSeal] Template ${templateId} processing complete`)
          return
        }

        console.log(`[DocuSeal] Still waiting... (docs: ${docs.length}, schema: ${schemaLen})`)
      } catch (err) {
        console.warn(`[DocuSeal] Error polling template ${templateId}:`, err)
      }

      await new Promise((resolve) => setTimeout(resolve, interval))
      interval = Math.min(Math.floor(interval * 1.5), maxInterval)
    }

    throw new Error(`Timeout: DocuSeal n'a pas terminé le traitement des documents après ${timeout}ms`)
  }

  private async deriveAttachmentUuids(templateId: number, templateObj: any): Promise<string[]> {
    let attachmentUuids: string[] = []

    // Strategy 1: Extract from existing fields
    const existingFields = Array.isArray(templateObj?.fields) ? templateObj.fields : []
    const existingAreas = existingFields.flatMap((f: any) => (Array.isArray(f.areas) ? f.areas : []))
    if (existingAreas.length) {
      attachmentUuids = existingAreas.map((a: any) => a.attachment_uuid).filter(Boolean)
    }

    // Strategy 2: Extract from schema
    if (attachmentUuids.length === 0 && Array.isArray(templateObj?.schema)) {
      attachmentUuids = templateObj.schema.map((s: any) => s.attachment_uuid).filter(Boolean)
    }

    // Strategy 3: Fetch template and try again
    if (attachmentUuids.length === 0) {
      console.log(`[DocuSeal] No attachment UUIDs found, fetching template ${templateId}...`)
      const fetchedTemplate = await this.getTemplate(templateId)

      const areas = (fetchedTemplate.fields || []).flatMap((f: any) => f.areas || [])
      attachmentUuids = areas.map((a: any) => a.attachment_uuid).filter(Boolean)

      if (attachmentUuids.length === 0 && Array.isArray(fetchedTemplate.schema)) {
        attachmentUuids = fetchedTemplate.schema.map((s: any) => s.attachment_uuid).filter(Boolean)
      }
    }

    // Ensure uniqueness and preserve order
    const seen = new Set<string>()
    const unique: string[] = []
    for (const uuid of attachmentUuids) {
      if (!seen.has(uuid)) {
        seen.add(uuid)
        unique.push(uuid)
      }
    }

    return unique
  }

  private async addSignatureField(templateId: number, signatureField: SignatureField) {
    const submitterUuid = crypto.randomUUID()

    const fieldData = {
      template: {
        submitters: [{ name: "Signer", uuid: submitterUuid }],
        fields: [
          {
            uuid: crypto.randomUUID(),
            submitter_uuid: submitterUuid,
            name: "Signature",
            type: "signature",
            required: true,
            preferences: {},
            areas: [
              {
                x: signatureField.x,
                y: signatureField.y,
                w: signatureField.width,
                h: signatureField.height,
                page: signatureField.page,
                attachment_uuid: null,
              },
            ],
          },
        ],
      },
    }

    const response = await fetch(`${this.baseUrl}/api/templates/${templateId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(fieldData),
    })

    if (!response.ok) {
      throw new Error(`Erreur ajout champ signature: ${await response.text()}`)
    }
  }

  private async addMultiAreaSignatureField(
    templateId: number,
    signatureField: SignatureField,
    attachmentUuids: string[],
  ) {
    const submitterUuid = crypto.randomUUID()

    const page = signatureField.page > 0 ? signatureField.page - 1 : signatureField.page

    // Créer une area pour chaque document
    const areas = attachmentUuids.map((attachment_uuid) => ({
      x: signatureField.x,
      y: signatureField.y,
      w: signatureField.width,
      h: signatureField.height,
      page: page,
      attachment_uuid: attachment_uuid,
    }))

    console.log(`[DocuSeal] Adding signature field with ${areas.length} areas`)

    const fieldData = {
      template: {
        submitters: [{ name: "Signer", uuid: submitterUuid }],
        fields: [
          {
            uuid: crypto.randomUUID(),
            submitter_uuid: submitterUuid,
            name: "",
            type: "signature",
            required: true,
            preferences: {},
            areas: areas,
          },
        ],
      },
    }

    const response = await fetch(`${this.baseUrl}/api/templates/${templateId}`, {
      method: "PUT",
      headers: this.getHeaders(),
      body: JSON.stringify(fieldData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[DocuSeal] Failed to add signature field:", errorText)
      throw new Error(`Erreur ajout champ signature: ${errorText}`)
    }

    console.log(`[DocuSeal] Signature field added successfully`)
  }

  async createSubmission(templateId: number, email: string): Promise<DocuSealSubmission> {
    const submissionData = {
      template_id: templateId,
      submitters: [{ email: email, send_email: false }],
      send_email: false,
      send_sms: false,
    }

    const response = await fetch(`${this.baseUrl}/api/submissions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(submissionData),
    })

    if (!response.ok) {
      throw new Error(`Erreur création soumission: ${await response.text()}`)
    }

    const result = await response.json()
    const submission = Array.isArray(result) ? result[0] : result

    return {
      id: submission.id,
      url: submission.url || submission.link || `${this.baseUrl}/s/${submission.uuid || submission.slug}`,
      submission_id: submission.submission_id || submission.submission?.id,
    }
  }

  async createSubmissionForTemplate(templateId: number, email: string, sendEmail = false): Promise<DocuSealSubmission> {
    const submissionData = {
      template_id: templateId,
      submitters: [{ email: email, send_email: sendEmail }],
      send_email: sendEmail,
      send_sms: false,
    }

    console.log(`[DocuSeal] Creating submission for template ${templateId}, email: ${email}`)

    const response = await fetch(`${this.baseUrl}/api/submissions`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(submissionData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[DocuSeal] Submission creation failed:", errorText)
      throw new Error(`Erreur création soumission: ${errorText}`)
    }

    const result = await response.json()
    const submission = Array.isArray(result) ? result[0] : result

    const submitterSlug = submission.slug || submission.submitter_slug
    const submissionSlug = submission.submission?.slug
    const sBySlug = submitterSlug ? `${this.baseUrl}/s/${submitterSlug}` : null
    const sByUuid = submission.uuid ? `${this.baseUrl}/s/${submission.uuid}` : null
    const eBySlug = submissionSlug ? `${this.baseUrl}/e/${submissionSlug}` : null

    const signUrl = submission.url || submission.link || sBySlug || sByUuid || eBySlug || ""

    console.log(`[DocuSeal] Submission created: ID=${submission.id}, URL=${signUrl}`)

    return {
      id: submission.id,
      url: signUrl,
      submission_id: submission.submission_id || submission.submission?.id,
    }
  }

  async getTemplate(templateId: number): Promise<DocuSealTemplate> {
    const response = await fetch(`${this.baseUrl}/api/templates/${templateId}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Erreur récupération template: ${await response.text()}`)
    }

    return await response.json()
  }

  async getSubmissionDocuments(submissionId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/submissions/${submissionId}`, {
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Erreur récupération documents: ${await response.text()}`)
    }

    return await response.json()
  }
}

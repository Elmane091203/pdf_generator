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

  constructor(apiKey: string, baseUrl = "https://firndebi.mosikasign.com") {
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

    console.log(`[DocuSeal] Creating template: ${templateName}`)

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

    // Attendre que DocuSeal traite le document
    const refreshedTemplate = await this.waitForTemplateAnalysis(template.id, 1, 30000)
    if (refreshedTemplate) {
      console.log(`[DocuSeal] Template refreshed, documents: ${refreshedTemplate.schema?.length || 0}`)
      template.schema = refreshedTemplate.schema
      template.documents = refreshedTemplate.documents
    }

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

    // Attendre que DocuSeal traite les documents
    const refreshedTemplate = await this.waitForTemplateAnalysis(template.id, pdfBuffers.length, 30000)
    if (refreshedTemplate) {
      console.log(`[DocuSeal] Template refreshed, documents: ${refreshedTemplate.schema?.length || 0}`)
      template.schema = refreshedTemplate.schema
      template.documents = refreshedTemplate.documents
    }

    // Récupérer les attachment_uuids
    const attachmentUuids = await this.deriveAttachmentUuids(template.id, template)
    console.log(`[DocuSeal] Derived attachment UUIDs: ${attachmentUuids.length}`)

    // Ajouter le champ de signature avec multi-areas (une zone par document)
    await this.addMultiAreaSignatureField(template.id, signatureField, attachmentUuids)

    return template
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

  private async waitForTemplateAnalysis(templateId: number, expectedDocumentsCount = 1, timeoutMs = 30000): Promise<DocuSealTemplate | null> {
    const start = Date.now()
    let interval = 500 // ms
    const maxInterval = 5000

    console.log(`[DocuSeal] Waiting for template ${templateId} analysis...`)

    while (Date.now() - start < timeoutMs) {
      try {
        const r = await fetch(`${this.baseUrl}/api/templates/${templateId}`, { 
          headers: this.getHeaders() 
        })
        
        if (!r.ok) {
          console.warn(`[DocuSeal] Failed to fetch template ${templateId} during polling: ${r.status}`)
          break
        }
        
        const tpl = await r.json()

        // Basic checks: documents count and either schema entries or preview/metadata on documents
        const docs = Array.isArray(tpl.documents) ? tpl.documents : []
        const schemaLen = Array.isArray(tpl.schema) ? tpl.schema.length : 0

        const docsHavePreviewOrMetadata = docs.length >= expectedDocumentsCount && docs.every((d: any) => {
          if (d.preview_image_url) return true
          if (d.metadata && d.metadata.pdf && d.metadata.pdf.number_of_pages) return true
          return false
        })

        if (schemaLen >= expectedDocumentsCount || docsHavePreviewOrMetadata) {
          console.log(`[DocuSeal] Template ${templateId} analysis complete`)
          return tpl
        }

        console.log(`[DocuSeal] Still analyzing... (docs: ${docs.length}, schema: ${schemaLen})`)
      } catch (err) {
        console.warn(`[DocuSeal] Error while polling template ${templateId}:`, err)
      }

      // wait and increase interval (simple backoff)
      await new Promise(resolve => setTimeout(resolve, interval))
      interval = Math.min(Math.floor(interval * 1.5), maxInterval)
    }

    console.warn(`[DocuSeal] Template ${templateId} analysis timeout after ${timeoutMs}ms`)
    return null
  }

  private async waitForTemplateProcessing(templateId: number, expectedDocumentsCount: number, timeout = 30000) {
    const result = await this.waitForTemplateAnalysis(templateId, expectedDocumentsCount, timeout)
    if (!result) {
      throw new Error(`Timeout: DocuSeal n'a pas terminé le traitement des documents après ${timeout}ms`)
    }
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

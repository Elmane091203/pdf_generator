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

    // Attendre que DocuSeal traite le document
    await this.waitForTemplateProcessing(template.id)

    // Ajouter le champ de signature
    await this.addSignatureField(template.id, signatureField)

    return template
  }

  async createMultiDocumentTemplate(
    pdfBuffers: Array<{ buffer: Buffer; filename: string }>,
    templateName: string,
    signatureField: SignatureField,
  ): Promise<DocuSealTemplate> {
    // Encoder tous les PDFs en base64
    const documents = pdfBuffers.map(({ buffer, filename }) => ({
      file: buffer.toString("base64"),
      filename: filename,
      content_type: "application/pdf",
    }))

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
      throw new Error(`Erreur création template: ${await response.text()}`)
    }

    const template = await response.json()

    // Attendre que DocuSeal traite tous les documents
    await this.waitForTemplateProcessing(template.id)

    // Récupérer le template avec les attachment_uuids
    const processedTemplate = await this.getTemplate(template.id)

    // Ajouter le champ de signature avec multi-areas (une zone par document)
    await this.addMultiAreaSignatureField(template.id, signatureField, processedTemplate.schema)

    return template
  }

  private async waitForTemplateProcessing(templateId: number, timeout = 30000) {
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      const template = await this.getTemplate(templateId)

      // Vérifier que le schema existe et contient des attachment_uuids
      if (template.schema && template.schema.length > 0) {
        const hasAttachmentUuids = template.schema.every((doc: any) => doc.attachment_uuid)
        if (hasAttachmentUuids) {
          return
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    throw new Error("Timeout: DocuSeal n'a pas terminé le traitement des documents")
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

  private async addMultiAreaSignatureField(templateId: number, signatureField: SignatureField, schema: any[]) {
    const submitterUuid = crypto.randomUUID()

    // Créer une area pour chaque document
    const areas = schema.map((doc: any, index: number) => ({
      x: signatureField.x,
      y: signatureField.y,
      w: signatureField.width,
      h: signatureField.height,
      page: signatureField.page,
      attachment_uuid: doc.attachment_uuid,
    }))

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
      throw new Error(`Erreur ajout champ signature: ${await response.text()}`)
    }
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
}

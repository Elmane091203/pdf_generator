export interface SignatureField {
  x: number;      // Position X normalisée (0-1)
  y: number;      // Position Y normalisée (0-1)
  width: number;  // Largeur normalisée (0-1)
  height: number; // Hauteur normalisée (0-1)
  page: number;   // Numéro de page (0-indexed)
}

export interface DocuSealTemplate {
  id: number;
  name: string;
  slug?: string;
  fields?: any[];
  documents?: any[];
}

export interface DocuSealSubmission {
  id: number;
  url: string;
  submission_id: number;
}

export class DocuSealClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = 'http://localhost:3000') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  private getHeaders() {
    return {
      'X-Auth-Token': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  async createTemplateWithSignature(
    pdfBuffer: Buffer,
    filename: string,
    templateName: string,
    signatureField: SignatureField
  ): Promise<DocuSealTemplate> {
    // Encoder le PDF en base64
    const encodedPdf = pdfBuffer.toString('base64');

    // Créer le template avec le document
    const templateData = {
      name: templateName,
      documents: [{
        file: encodedPdf,
        filename: filename,
        content_type: 'application/pdf'
      }]
    };

    const response = await fetch(`${this.baseUrl}/api/templates`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(templateData)
    });

    if (!response.ok) {
      throw new Error(`Erreur création template: ${await response.text()}`);
    }

    const template = await response.json();
    
    // Attendre que DocuSeal traite le document
    await this.waitForTemplateProcessing(template.id);
    
    // Ajouter le champ de signature
    await this.addSignatureField(template.id, signatureField);
    
    return template;
  }

  private async waitForTemplateProcessing(templateId: number, timeout: number = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      const response = await fetch(`${this.baseUrl}/api/templates/${templateId}`, {
        headers: this.getHeaders()
      });
      
      if (response.ok) {
        const template = await response.json();
        if (template.schema && template.schema.length > 0) {
          return;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  private async addSignatureField(templateId: number, signatureField: SignatureField) {
    const submitterUuid = crypto.randomUUID();
    
    const fieldData = {
      template: {
        submitters: [{ name: 'Signer', uuid: submitterUuid }],
        fields: [{
          uuid: crypto.randomUUID(),
          submitter_uuid: submitterUuid,
          name: 'Signature',
          type: 'signature',
          required: true,
          preferences: {},
          areas: [{
            x: signatureField.x,
            y: signatureField.y,
            w: signatureField.width,
            h: signatureField.height,
            page: signatureField.page,
            attachment_uuid: null
          }]
        }]
      }
    };

    const response = await fetch(`${this.baseUrl}/api/templates/${templateId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(fieldData)
    });

    if (!response.ok) {
      throw new Error(`Erreur ajout champ signature: ${await response.text()}`);
    }
  }

  async createSubmission(templateId: number, email: string): Promise<DocuSealSubmission> {
    const submissionData = {
      template_id: templateId,
      submitters: [{ email: email, send_email: false }],
      send_email: false,
      send_sms: false
    };

    const response = await fetch(`${this.baseUrl}/api/submissions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(submissionData)
    });

    if (!response.ok) {
      throw new Error(`Erreur création soumission: ${await response.text()}`);
    }

    const result = await response.json();
    const submission = Array.isArray(result) ? result[0] : result;
    
    return {
      id: submission.id,
      url: submission.url || submission.link || `${this.baseUrl}/s/${submission.uuid || submission.slug}`,
      submission_id: submission.submission_id || submission.submission?.id
    };
  }

  async createTemplateFromPDF(
    pdfBuffer: Buffer,
    filename: string,
    templateName: string,
    signatureField: SignatureField,
    signerEmail: string
  ) {
    // 1. Créer le template avec le PDF
    const template = await this.createTemplateWithSignature(pdfBuffer, filename, templateName, signatureField);
    
    // 2. Créer la soumission
    const submission = await this.createSubmission(template.id, signerEmail);
    
    return {
      templateId: template.id,
      templateSlug: template.slug,
      signUrl: submission.url,
      submissionId: submission.id,
      submission_id: submission.submission_id
    };
  }
}

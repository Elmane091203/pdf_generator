"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, CheckCircle2, AlertCircle, FileSignature } from "lucide-react"
import { DocuSealFormComponent } from "@/components/docuseal-form"

export function GeneratePDFForm() {
  const [jsonData, setJsonData] = useState(`{
  "lot_nom": "BTS-2024",
  "etudiants": [
    {
      "nom_etudiant": "Dupont Jean",
      "specialite": "Informatique",
      "date_obtention": "2024-06-15"
    },
    {
      "nom_etudiant": "Martin Marie",
      "specialite": "Mathématiques",
      "date_obtention": "2024-06-15"
    }
  ]
}`)
  const [templateType, setTemplateType] = useState<"bep" | "bp" | "bt">("bep")
  const [downloadMode, setDownloadMode] = useState<"zip" | "individual" | "signature">("zip")
  const [signerEmail, setSignerEmail] = useState("signer@example.com")
  const [signaturePosition, setSignaturePosition] = useState({
    x: 0.75,
    y: 0.85,
    width: 0.15,
    height: 0.08,
    page: 0
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    signUrl?: string
    templateId?: number
  } | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)

    try {
      const data = JSON.parse(jsonData)
      data.template_type = templateType
      data.download_mode = downloadMode

      // Si mode signature, utiliser la nouvelle API
      if (downloadMode === "signature") {
        data.signer_email = signerEmail
        data.signature_position = signaturePosition

        const response = await fetch("/api/generate-with-signature", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (result.success) {
          setResult({
            success: true,
            message: result.message,
            signUrl: result.signUrl,
            templateId: result.templateId
          })
        } else {
          setResult({
            success: false,
            message: result.error || "Une erreur est survenue",
          })
        }
      } else {
        // Mode normal (ZIP ou individuel)
        const response = await fetch("/api/generate-diplomas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        if (response.ok) {
          if (downloadMode === "zip") {
            // Télécharger le fichier ZIP
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${data.lot_nom}_diplomes.zip`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            setResult({
              success: true,
              message: `Fichier ZIP généré avec succès ! ${data.etudiants.length} diplôme(s) créé(s).`,
            })
          } else {
            // Download individual PDFs
            const pdfData = await response.json()

            // Download each PDF with a small delay to avoid browser blocking
            for (let i = 0; i < pdfData.pdfs.length; i++) {
              await new Promise((resolve) => setTimeout(resolve, 300 * i))

              const { filename, data: base64Data } = pdfData.pdfs[i]
              
              // Convert base64 to blob
              const byteCharacters = atob(base64Data)
              const byteNumbers = new Array(byteCharacters.length)
              for (let j = 0; j < byteCharacters.length; j++) {
                byteNumbers[j] = byteCharacters.charCodeAt(j)
              }
              const byteArray = new Uint8Array(byteNumbers)
              const blob = new Blob([byteArray], { type: "application/pdf" })

              const url = window.URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = filename
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              window.URL.revokeObjectURL(url)
            }

            setResult({
              success: true,
              message: `${pdfData.pdfs.length} diplôme(s) téléchargé(s) individuellement.`,
            })
          }
        } else {
          const errorData = await response.json()
          setResult({
            success: false,
            message: errorData.error || "Une erreur est survenue",
          })
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Erreur lors de la génération",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template-select">Type de diplôme</Label>
        <Select value={templateType} onValueChange={(value: "bep" | "bp" | "bt") => setTemplateType(value)}>
          <SelectTrigger id="template-select">
            <SelectValue placeholder="Sélectionner un template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bep">BEP - Brevet d'Etudes Professionnel</SelectItem>
            <SelectItem value="bp">BP - Brevet Professionnel</SelectItem>
            <SelectItem value="bt">BT - Brevet de Technicien</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Mode de génération</Label>
        <RadioGroup value={downloadMode} onValueChange={(value: "zip" | "individual" | "signature") => setDownloadMode(value)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="zip" id="zip" />
            <Label htmlFor="zip" className="font-normal cursor-pointer">
              Fichier ZIP (tous les diplômes dans un seul fichier)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="individual" id="individual" />
            <Label htmlFor="individual" className="font-normal cursor-pointer">
              Téléchargements individuels (un fichier par diplôme)
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="signature" id="signature" />
            <Label htmlFor="signature" className="font-normal cursor-pointer flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              Créer template avec signature DocuSeal
            </Label>
          </div>
        </RadioGroup>
      </div>

      {downloadMode === "signature" && (
        <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
          <h3 className="font-semibold text-blue-900">Configuration de la signature</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="signer-email">Email du signataire</Label>
              <Input
                id="signer-email"
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="signer@example.com"
              />
            </div>
          </div>

          <div>
            <Label>Position de la signature (coordonnées normalisées 0-1)</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={signaturePosition.x}
                  onChange={(e) => setSignaturePosition(prev => ({ ...prev, x: parseFloat(e.target.value) }))}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={signaturePosition.y}
                  onChange={(e) => setSignaturePosition(prev => ({ ...prev, y: parseFloat(e.target.value) }))}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Largeur</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={signaturePosition.width}
                  onChange={(e) => setSignaturePosition(prev => ({ ...prev, width: parseFloat(e.target.value) }))}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Hauteur</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={signaturePosition.height}
                  onChange={(e) => setSignaturePosition(prev => ({ ...prev, height: parseFloat(e.target.value) }))}
                  className="text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">Page</Label>
                <Input
                  type="number"
                  min="0"
                  value={signaturePosition.page}
                  onChange={(e) => setSignaturePosition(prev => ({ ...prev, page: parseInt(e.target.value) }))}
                  className="text-xs"
                />
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Position par défaut : en bas à droite du texte "Signature :"
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="json-data">Données JSON</Label>
        <Textarea
          id="json-data"
          value={jsonData}
          onChange={(e) => setJsonData(e.target.value)}
          placeholder="Entrez les données JSON..."
          className="min-h-[300px] font-mono text-sm"
        />
      </div>

      <Button onClick={handleGenerate} disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {downloadMode === "signature" ? "Création du template..." : "Génération en cours..."}
          </>
        ) : (
          downloadMode === "signature" ? "Créer Template avec Signature" : "Générer les Diplômes"
        )}
      </Button>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription className="ml-2">{result.message}</AlertDescription>
        </Alert>
      )}

      {result?.success && result.signUrl && (
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-green-50">
            <h3 className="font-semibold text-green-900 mb-2">Template créé avec succès !</h3>
            <p className="text-sm text-green-700">
              Le template DocuSeal a été créé. Vous pouvez maintenant signer le document.
            </p>
            <div className="mt-2 text-xs text-gray-600">
              Template ID: {result.templateId}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Formulaire de signature</h3>
            <DocuSealFormComponent 
              src={result.signUrl} 
              email={signerEmail} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

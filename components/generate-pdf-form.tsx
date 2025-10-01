"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"

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
  const [downloadMode, setDownloadMode] = useState<"zip" | "individual">("zip")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)

    try {
      const data = JSON.parse(jsonData)
      data.template_type = templateType
      data.download_mode = downloadMode

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
        <Label>Mode de téléchargement</Label>
        <RadioGroup value={downloadMode} onValueChange={(value: "zip" | "individual") => setDownloadMode(value)}>
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
        </RadioGroup>
      </div>

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
            Génération en cours...
          </>
        ) : (
          "Générer les Diplômes"
        )}
      </Button>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription className="ml-2">{result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

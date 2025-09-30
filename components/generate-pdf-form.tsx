"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Download, CheckCircle2, AlertCircle } from "lucide-react"

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
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    downloadUrl?: string
  } | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)

    try {
      const data = JSON.parse(jsonData)
      data.template_type = templateType

      const response = await fetch("/api/generate-diplomas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const resultData = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: resultData.message,
          downloadUrl: resultData.downloadUrl,
        })
      } else {
        setResult({
          success: false,
          message: resultData.error || "Une erreur est survenue",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Erreur de parsing JSON",
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
          <AlertDescription className="ml-2">
            {result.message}
            {result.downloadUrl && (
              <div className="mt-2">
                <Button asChild size="sm" variant="outline">
                  <a href={result.downloadUrl} download>
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le ZIP
                  </a>
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

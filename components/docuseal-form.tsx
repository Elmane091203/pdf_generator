"use client"

import { DocusealForm } from "@docuseal/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DocuSealFormProps {
  src?: string
  email?: string
  templateId?: number
}

export function DocuSealFormComponent({ src, email, templateId }: DocuSealFormProps) {
  const [signerEmail, setSignerEmail] = useState(email || "")
  const [signUrl, setSignUrl] = useState(src || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleCreateSubmission = async () => {
    if (!templateId || !signerEmail) {
      setError("Template ID et email requis")
      return
    }

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/templates/${templateId}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: signerEmail,
          send_email: false,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSignUrl(data.signUrl)
      } else {
        setError(data.error || "Erreur lors de la création de la soumission")
      }
    } catch (err) {
      setError("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  if (!signUrl && templateId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Créer une soumission</CardTitle>
          <CardDescription>Entrez l'email du signataire pour générer un lien de signature</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email du signataire</Label>
            <Input
              id="email"
              type="email"
              placeholder="signataire@example.com"
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleCreateSubmission} disabled={loading || !signerEmail} className="w-full">
            {loading ? "Création..." : "Créer la soumission"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!signUrl) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Aucun lien de signature disponible</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden">
      <DocusealForm src={signUrl} email={signerEmail} />
    </div>
  )
}

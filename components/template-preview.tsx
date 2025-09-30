"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DiplomaTemplate } from "@/components/diploma-template"

export function TemplatePreview() {
  const [studentData, setStudentData] = useState({
    nom_etudiant: "Dupont Jean",
    specialite: "Informatique",
    date_obtention: "2024-06-15",
  })

  const [templateType, setTemplateType] = useState<"bep" | "bp" | "bt">("bep")

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="template">Type de diplôme</Label>
          <Select value={templateType} onValueChange={(value: "bep" | "bp" | "bt") => setTemplateType(value)}>
            <SelectTrigger id="template">
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
          <Label htmlFor="nom">Nom de l'étudiant</Label>
          <Input
            id="nom"
            value={studentData.nom_etudiant}
            onChange={(e) => setStudentData({ ...studentData, nom_etudiant: e.target.value })}
            placeholder="Nom complet"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialite">Spécialité</Label>
          <Input
            id="specialite"
            value={studentData.specialite}
            onChange={(e) => setStudentData({ ...studentData, specialite: e.target.value })}
            placeholder="Spécialité"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Date d'obtention</Label>
          <Input
            id="date"
            type="date"
            value={studentData.date_obtention}
            onChange={(e) => setStudentData({ ...studentData, date_obtention: e.target.value })}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-8 shadow-lg">
        <DiplomaTemplate
          nom_etudiant={studentData.nom_etudiant}
          specialite={studentData.specialite}
          date_obtention={studentData.date_obtention}
          templateType={templateType}
        />
      </div>
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Save,
  RotateCcw,
  AlertCircle,
  Download,
  Upload,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Plus,
  Trash2,
  Copy,
  Undo,
  Redo,
  ChevronUp,
  ChevronDown,
  Square,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface TemplateConfig {
  html: string
  styles: {
    [key: string]: string
  }
}

const DEFAULT_TEMPLATES: Record<string, TemplateConfig> = {
  bep: {
    html: `<div style="text-align: center; padding: 20px;">
  <h1 style="margin-top: 21.47px; margin-bottom: 21.47px;">Brevet d'Etudes Professionnel</h1>
  <p style="margin-top: 18px; margin-bottom: 18px;">Ce diplôme est décerné à Mr</p>
  <h2 style="margin-top: 20px; margin-bottom: 20px;">{{Nom_etudiant}}</h2>
  <p style="margin-top: 18px; margin-bottom: 18px;">pour avoir satisfait aux exigences du programme</p>
  <h3 style="margin-top: 20px; margin-bottom: 20px;">{{specialite}}</h3>
  <p style="margin-top: 18px; margin-bottom: 18px;">et avoir démontré les compétences requises pour l'obtention de ce diplôme.</p>
  <div style="margin-top: 40px; margin-left: 20px; margin-right: 20px; text-align: left;">
    <span><strong>Date de délivrance : </strong>{{Date}}</span>
    <span style="margin-left: 100px;"><strong>Signature : </strong></span>
  </div>
</div>`,
    styles: {
      titleFontSize: "22px",
      titleColor: "#003366",
      textFontSize: "18px",
      studentNameFontSize: "24px",
      specialiteFontSize: "22px",
      footerFontSize: "12px",
    },
  },
  bp: {
    html: `<div style="border: 2px solid #000; padding: 40px; text-align: center;">
  <h1 style="text-transform: uppercase; margin-bottom: 20px;">Brevet Professionnel</h1>
  <p style="margin: 10px 0;">Ce diplôme est décerné à</p>
  <h2 style="margin: 20px 0;">{{Nom_etudiant}}</h2>
  <p style="margin: 10px 0;">pour avoir satisfait aux exigences du programme</p>
  <h3 style="margin: 20px 0;">{{specialite}}</h3>
  <p style="margin: 10px 0;">et avoir démontré les compétences requises pour l'obtention de ce diplôme.</p>
  <div style="margin-top: 60px;">
    <span><strong>Date de délivrance : </strong>{{Date}}</span>
    <span style="margin-left: 20px;"><strong>Signature : </strong>__________</span>
  </div>
</div>`,
    styles: {
      titleFontSize: "22px",
      titleColor: "#003366",
      textFontSize: "18px",
      studentNameFontSize: "24px",
      specialiteFontSize: "22px",
      footerFontSize: "12px",
      borderWidth: "2px",
    },
  },
  bt: {
    html: `<div style="text-align: center; padding: 20px;">
  <h1 style="margin-top: 21.47px; margin-bottom: 21.47px;">Brevet de Technicien</h1>
  <p style="margin-top: 18px; margin-bottom: 18px;">Ce diplôme est décerné à Mr</p>
  <h2 style="margin-top: 20px; margin-bottom: 20px;">{{Nom_etudiant}}</h2>
  <p style="margin-top: 18px; margin-bottom: 18px;">pour avoir satisfait aux exigences du programme</p>
  <h3 style="margin-top: 20px; margin-bottom: 20px;">{{specialite}}</h3>
  <p style="margin-top: 18px; margin-bottom: 18px;">et avoir démontré les compétences requises pour l'obtention de ce diplôme.</p>
  <div style="margin-top: 40px; margin-left: 20px; margin-right: 20px; text-align: left;">
    <span><strong>Date de délivrance : </strong>{{Date}}</span>
    <span style="margin-left: 100px;"><strong>Signature : </strong></span>
  </div>
</div>`,
    styles: {
      titleFontSize: "22px",
      titleColor: "#003366",
      textFontSize: "18px",
      studentNameFontSize: "24px",
      specialiteFontSize: "22px",
      footerFontSize: "12px",
    },
  },
}

export function TemplateEditor() {
  const [templateType, setTemplateType] = useState<"bep" | "bp" | "bt">("bep")
  const [htmlContent, setHtmlContent] = useState("")
  const [styles, setStyles] = useState<{ [key: string]: string }>({})
  const [previewData, setPreviewData] = useState({
    Nom_etudiant: "Jean Dupont",
    specialite: "Informatique",
    Date: "2024-06-15",
  })
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const savedTemplate = localStorage.getItem(`template_${templateType}`)
    if (savedTemplate) {
      const parsed = JSON.parse(savedTemplate)
      setHtmlContent(parsed.html)
      setStyles(parsed.styles)
      addToHistory(parsed.html) // Initialize history with loaded content
    } else {
      setHtmlContent(DEFAULT_TEMPLATES[templateType].html)
      setStyles(DEFAULT_TEMPLATES[templateType].styles)
      addToHistory(DEFAULT_TEMPLATES[templateType].html) // Initialize history with default content
    }
  }, [templateType])

  const handleSave = () => {
    const templateConfig: TemplateConfig = {
      html: htmlContent,
      styles,
    }
    localStorage.setItem(`template_${templateType}`, JSON.stringify(templateConfig))
    setSaveMessage("Template sauvegardé avec succès!")
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleReset = () => {
    setHtmlContent(DEFAULT_TEMPLATES[templateType].html)
    setStyles(DEFAULT_TEMPLATES[templateType].styles)
    localStorage.removeItem(`template_${templateType}`)
    setHistory([]) // Clear history on reset
    setHistoryIndex(-1)
    setSelectedElement(null) // Deselect element on reset
    setSaveMessage("Template réinitialisé!")
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleExport = () => {
    const templateConfig: TemplateConfig = {
      html: htmlContent,
      styles,
    }
    const dataStr = JSON.stringify(templateConfig, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `template_${templateType}_${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setSaveMessage("Template exporté avec succès!")
    setTimeout(() => setSaveMessage(null), 3000)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const templateConfig: TemplateConfig = JSON.parse(content)
        setHtmlContent(templateConfig.html)
        setStyles(templateConfig.styles)
        setHistory([]) // Clear history on import
        setHistoryIndex(-1)
        setSelectedElement(null) // Deselect element on import
        setSaveMessage("Template importé avec succès!")
        setTimeout(() => setSaveMessage(null), 3000)
      } catch (error) {
        setSaveMessage("Erreur lors de l'import du template")
        setTimeout(() => setSaveMessage(null), 3000)
      }
    }
    reader.readAsText(file)
  }

  const renderPreview = () => {
    let html = htmlContent
    Object.entries(previewData).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), value)
    })
    return html
  }

  const updateStyle = (key: string, value: string) => {
    setStyles((prev) => ({ ...prev, [key]: value }))
  }

  const handleElementClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const target = e.target as HTMLElement

    if (target === previewRef.current) {
      setSelectedElement(null) // Deselect if clicking the container itself
      return
    }

    setSelectedElement(target)
    setIsEditing(false)
    // Ensure contentEditable is false when clicking to select, unless it's already editing
    if (target.contentEditable === "true") {
      target.contentEditable = "false"
    }
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const target = e.target as HTMLElement

    if (target === previewRef.current) {
      return
    }

    setSelectedElement(target)
    setIsEditing(true)
    target.contentEditable = "true"
    target.focus()
  }

  const addToHistory = (html: string) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(html)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setHtmlContent(history[historyIndex - 1])
      // Re-apply styles to ensure consistency after undo
      if (previewRef.current) {
        applyStylesFromHtml(previewRef.current.innerHTML)
      }
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setHtmlContent(history[historyIndex + 1])
      // Re-apply styles to ensure consistency after redo
      if (previewRef.current) {
        applyStylesFromHtml(previewRef.current.innerHTML)
      }
    }
  }

  // Helper to re-apply styles based on the current HTML content
  const applyStylesFromHtml = (html: string) => {
    if (!previewRef.current) return
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html
    const elements = tempDiv.querySelectorAll("*")
    elements.forEach((element) => {
      if (element instanceof HTMLElement) {
        const inlineStyles = element.style
        Object.keys(inlineStyles).forEach((styleName) => {
          // This is a simplification, a more robust solution would parse CSS classes or more complex inline styles
          // For now, we re-apply directly if it's a known style that might have been manipulated
          // This part might need more refinement based on how styles are managed
        })
      }
    })
    // Re-apply global styles if any were changed
    Object.entries(styles).forEach(([key, value]) => {
      if (previewRef.current) {
        previewRef.current.style[key as any] = value
      }
    })
  }

  const applyStyleToSelected = (property: string, value: string) => {
    if (!selectedElement) return

    // Store original styles to potentially revert or compare if needed
    const originalStyles = { ...selectedElement.style }

    selectedElement.style[property as any] = value

    if (previewRef.current) {
      const updatedHtml = previewRef.current.innerHTML
      const html = updatedHtml
      // This replacement logic is problematic: it replaces preview data values with variable names, which is incorrect
      // It should parse the current state of the previewRef and set htmlContent
      // For now, let's focus on updating htmlContent from the DOM
      setHtmlContent(previewRef.current.innerHTML)
      addToHistory(previewRef.current.innerHTML)
    }
  }

  const deleteSelectedElement = () => {
    if (!selectedElement || selectedElement === previewRef.current) return

    selectedElement.remove()
    setSelectedElement(null)

    if (previewRef.current) {
      const updatedHtml = previewRef.current.innerHTML
      setHtmlContent(updatedHtml)
      addToHistory(updatedHtml)
    }
  }

  const duplicateSelectedElement = () => {
    if (!selectedElement || selectedElement === previewRef.current) return

    const clone = selectedElement.cloneNode(true) as HTMLElement
    selectedElement.parentNode?.insertBefore(clone, selectedElement.nextSibling)

    if (previewRef.current) {
      const updatedHtml = previewRef.current.innerHTML
      setHtmlContent(updatedHtml)
      addToHistory(updatedHtml)
    }
  }

  const moveElementUp = () => {
    if (!selectedElement || selectedElement === previewRef.current) return

    const prev = selectedElement.previousElementSibling
    if (prev) {
      selectedElement.parentNode?.insertBefore(selectedElement, prev)

      if (previewRef.current) {
        const updatedHtml = previewRef.current.innerHTML
        setHtmlContent(updatedHtml)
        addToHistory(updatedHtml)
      }
    }
  }

  const moveElementDown = () => {
    if (!selectedElement || selectedElement === previewRef.current) return

    const next = selectedElement.nextElementSibling
    if (next) {
      selectedElement.parentNode?.insertBefore(next, selectedElement)

      if (previewRef.current) {
        const updatedHtml = previewRef.current.innerHTML
        setHtmlContent(updatedHtml)
        addToHistory(updatedHtml)
      }
    }
  }

  const addNewElement = (tagName: string, content = "Nouveau texte") => {
    if (!previewRef.current) return

    const newElement = document.createElement(tagName)
    newElement.textContent = content
    newElement.style.margin = "10px 0"

    if (selectedElement && selectedElement !== previewRef.current) {
      selectedElement.parentNode?.insertBefore(newElement, selectedElement.nextSibling)
    } else {
      previewRef.current.appendChild(newElement)
    }

    const updatedHtml = previewRef.current.innerHTML
    setHtmlContent(updatedHtml)
    addToHistory(updatedHtml)
  }

  const toggleTextDecoration = (decoration: string) => {
    if (!selectedElement) return

    const current = selectedElement.style.textDecoration
    if (current.includes(decoration)) {
      selectedElement.style.textDecoration = current.replace(decoration, "").trim()
    } else {
      selectedElement.style.textDecoration = current ? `${current} ${decoration}` : decoration
    }

    if (previewRef.current) {
      const updatedHtml = previewRef.current.innerHTML
      setHtmlContent(updatedHtml)
      addToHistory(updatedHtml)
    }
  }

  const convertToList = (ordered: boolean) => {
    if (!selectedElement) return

    const listTag = ordered ? "ol" : "ul"
    const list = document.createElement(listTag)
    list.style.textAlign = selectedElement.style.textAlign || "left"
    list.style.margin = "10px 0"
    list.style.paddingLeft = "40px"

    const li = document.createElement("li")
    li.innerHTML = selectedElement.innerHTML
    list.appendChild(li)

    selectedElement.parentNode?.replaceChild(list, selectedElement)
    setSelectedElement(list)

    if (previewRef.current) {
      const updatedHtml = previewRef.current.innerHTML
      setHtmlContent(updatedHtml)
      addToHistory(updatedHtml)
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    const target = e.target as HTMLElement
    target.contentEditable = "false"
    setIsEditing(false)

    if (previewRef.current) {
      const updatedHtml = previewRef.current.innerHTML
      setHtmlContent(updatedHtml)
      addToHistory(updatedHtml)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template-type">Type de diplôme</Label>
        <Select value={templateType} onValueChange={(value: "bep" | "bp" | "bt") => setTemplateType(value)}>
          <SelectTrigger id="template-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bep">BEP - Brevet d'Etudes Professionnel</SelectItem>
            <SelectItem value="bp">BP - Brevet Professionnel</SelectItem>
            <SelectItem value="bt">BT - Brevet de Technicien</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="visual">Éditeur Visuel</TabsTrigger>
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="styles">Styles</TabsTrigger>
          <TabsTrigger value="preview">Aperçu</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
              {/* Row 1: History and basic formatting */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Annuler (Ctrl+Z)"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  title="Rétablir (Ctrl+Y)"
                >
                  <Redo className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!selectedElement}>
                      <Type className="mr-2 h-4 w-4" />
                      Police
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56">
                    <div className="space-y-2">
                      <Label>Famille de police</Label>
                      <Select
                        onValueChange={(value) => applyStyleToSelected("fontFamily", value)}
                        disabled={!selectedElement}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial, Helvetica, sans-serif">Arial</SelectItem>
                          <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                          <SelectItem value="'Courier New', Courier, monospace">Courier New</SelectItem>
                          <SelectItem value="Georgia, serif">Georgia</SelectItem>
                          <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                        </SelectContent>
                      </Select>
                      <Label className="mt-3">Taille</Label>
                      <Select
                        onValueChange={(value) => applyStyleToSelected("fontSize", value)}
                        disabled={!selectedElement}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48].map((size) => (
                            <SelectItem key={size} value={`${size}px`}>
                              {size}px
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentWeight = selectedElement?.style.fontWeight
                    applyStyleToSelected("fontWeight", currentWeight === "bold" ? "normal" : "bold")
                  }}
                  disabled={!selectedElement}
                  title="Gras"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentStyle = selectedElement?.style.fontStyle
                    applyStyleToSelected("fontStyle", currentStyle === "italic" ? "normal" : "italic")
                  }}
                  disabled={!selectedElement}
                  title="Italique"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleTextDecoration("underline")}
                  disabled={!selectedElement}
                  title="Souligné"
                >
                  <Underline className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleTextDecoration("line-through")}
                  disabled={!selectedElement}
                  title="Barré"
                >
                  <Strikethrough className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!selectedElement}>
                      <Palette className="mr-2 h-4 w-4" />
                      Couleurs
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Couleur du texte</Label>
                        <input
                          type="color"
                          className="h-10 w-full cursor-pointer rounded border"
                          onChange={(e) => applyStyleToSelected("color", e.target.value)}
                          disabled={!selectedElement}
                        />
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            "#000000",
                            "#003366",
                            "#0066cc",
                            "#cc0000",
                            "#00cc00",
                            "#666666",
                            "#999999",
                            "#ffffff",
                            "#ff6600",
                            "#9900cc",
                            "#ffcc00",
                            "#00cccc",
                          ].map((color) => (
                            <button
                              key={color}
                              className="h-8 w-8 rounded border hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              onClick={() => applyStyleToSelected("color", color)}
                              disabled={!selectedElement}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label>Couleur de fond</Label>
                        <input
                          type="color"
                          className="h-10 w-full cursor-pointer rounded border"
                          onChange={(e) => applyStyleToSelected("backgroundColor", e.target.value)}
                          disabled={!selectedElement}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                          onClick={() => applyStyleToSelected("backgroundColor", "transparent")}
                          disabled={!selectedElement}
                        >
                          Transparent
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Row 2: Alignment and lists */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyStyleToSelected("textAlign", "left")}
                  disabled={!selectedElement}
                  title="Aligner à gauche"
                >
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyStyleToSelected("textAlign", "center")}
                  disabled={!selectedElement}
                  title="Centrer"
                >
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyStyleToSelected("textAlign", "right")}
                  disabled={!selectedElement}
                  title="Aligner à droite"
                >
                  <AlignRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyStyleToSelected("textAlign", "justify")}
                  disabled={!selectedElement}
                  title="Justifier"
                >
                  <AlignJustify className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => convertToList(false)}
                  disabled={!selectedElement}
                  title="Liste à puces"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => convertToList(true)}
                  disabled={!selectedElement}
                  title="Liste numérotée"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!selectedElement}>
                      Espacement
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Marge supérieure: {selectedElement?.style.marginTop || "0px"}</Label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          className="w-full"
                          onChange={(e) => applyStyleToSelected("marginTop", `${e.target.value}px`)}
                          disabled={!selectedElement}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Marge inférieure: {selectedElement?.style.marginBottom || "0px"}</Label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          className="w-full"
                          onChange={(e) => applyStyleToSelected("marginBottom", `${e.target.value}px`)}
                          disabled={!selectedElement}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Padding: {selectedElement?.style.padding || "0px"}</Label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          className="w-full"
                          onChange={(e) => applyStyleToSelected("padding", `${e.target.value}px`)}
                          disabled={!selectedElement}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hauteur de ligne: {selectedElement?.style.lineHeight || "normal"}</Label>
                        <Select
                          onValueChange={(value) => applyStyleToSelected("lineHeight", value)}
                          disabled={!selectedElement}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Normal" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1</SelectItem>
                            <SelectItem value="1.2">1.2</SelectItem>
                            <SelectItem value="1.5">1.5</SelectItem>
                            <SelectItem value="1.8">1.8</SelectItem>
                            <SelectItem value="2">2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Espacement des lettres: {selectedElement?.style.letterSpacing || "normal"}</Label>
                        <input
                          type="range"
                          min="-2"
                          max="10"
                          step="0.5"
                          className="w-full"
                          onChange={(e) => applyStyleToSelected("letterSpacing", `${e.target.value}px`)}
                          disabled={!selectedElement}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={!selectedElement}>
                      <Square className="mr-2 h-4 w-4" />
                      Bordure
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Largeur de bordure</Label>
                        <Select
                          onValueChange={(value) => {
                            const currentBorder = selectedElement?.style.border || ""
                            const parts = currentBorder.split(" ")
                            const style = parts[1] || "solid"
                            const color = parts[2] || "#000000"
                            applyStyleToSelected("border", `${value} ${style} ${color}`)
                          }}
                          disabled={!selectedElement}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0px">Aucune</SelectItem>
                            <SelectItem value="1px">1px</SelectItem>
                            <SelectItem value="2px">2px</SelectItem>
                            <SelectItem value="3px">3px</SelectItem>
                            <SelectItem value="4px">4px</SelectItem>
                            <SelectItem value="5px">5px</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Style de bordure</Label>
                        <Select
                          onValueChange={(value) => {
                            const currentBorder = selectedElement?.style.border || ""
                            const parts = currentBorder.split(" ")
                            const width = parts[0] || "1px"
                            const color = parts[2] || "#000000"
                            applyStyleToSelected("border", `${width} ${value} ${color}`)
                          }}
                          disabled={!selectedElement}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="solid">Solide</SelectItem>
                            <SelectItem value="dashed">Tirets</SelectItem>
                            <SelectItem value="dotted">Points</SelectItem>
                            <SelectItem value="double">Double</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Couleur de bordure</Label>
                        <input
                          type="color"
                          className="h-10 w-full cursor-pointer rounded border"
                          onChange={(e) => {
                            const currentBorder = selectedElement?.style.border || ""
                            const parts = currentBorder.split(" ")
                            const width = parts[0] || "1px"
                            const style = parts[1] || "solid"
                            applyStyleToSelected("border", `${width} ${style} ${e.target.value}`)
                          }}
                          disabled={!selectedElement}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Arrondi des coins</Label>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="1"
                          className="w-full"
                          onChange={(e) => applyStyleToSelected("borderRadius", `${e.target.value}px`)}
                          disabled={!selectedElement}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Row 3: Element manipulation */}
              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56">
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start bg-transparent"
                        onClick={() => addNewElement("h1", "Titre 1")}
                      >
                        <Heading1 className="mr-2 h-4 w-4" />
                        Titre 1
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start bg-transparent"
                        onClick={() => addNewElement("h2", "Titre 2")}
                      >
                        <Heading2 className="mr-2 h-4 w-4" />
                        Titre 2
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start bg-transparent"
                        onClick={() => addNewElement("h3", "Titre 3")}
                      >
                        <Heading3 className="mr-2 h-4 w-4" />
                        Titre 3
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start bg-transparent"
                        onClick={() => addNewElement("p", "Nouveau paragraphe")}
                      >
                        <Type className="mr-2 h-4 w-4" />
                        Paragraphe
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start bg-transparent"
                        onClick={() => addNewElement("div", "Nouveau conteneur")}
                      >
                        <Square className="mr-2 h-4 w-4" />
                        Conteneur
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={duplicateSelectedElement}
                  disabled={!selectedElement || selectedElement === previewRef.current}
                  title="Dupliquer"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={moveElementUp}
                  disabled={!selectedElement || selectedElement === previewRef.current}
                  title="Déplacer vers le haut"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={moveElementDown}
                  disabled={!selectedElement || selectedElement === previewRef.current}
                  title="Déplacer vers le bas"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={deleteSelectedElement}
                  disabled={!selectedElement || selectedElement === previewRef.current}
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {selectedElement && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div>
                      <strong>Élément:</strong> {selectedElement.tagName.toLowerCase()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Double-cliquez pour éditer le texte • Utilisez la barre d'outils pour modifier les styles
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="visual-preview-name">Nom étudiant</Label>
                <input
                  id="visual-preview-name"
                  type="text"
                  value={previewData.Nom_etudiant}
                  onChange={(e) => setPreviewData((prev) => ({ ...prev, Nom_etudiant: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visual-preview-specialite">Spécialité</Label>
                <input
                  id="visual-preview-specialite"
                  type="text"
                  value={previewData.specialite}
                  onChange={(e) => setPreviewData((prev) => ({ ...prev, specialite: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visual-preview-date">Date</Label>
                <input
                  id="visual-preview-date"
                  type="text"
                  value={previewData.Date}
                  onChange={(e) => setPreviewData((prev) => ({ ...prev, Date: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-white p-8">
              <div
                ref={previewRef}
                className="mx-auto max-w-3xl cursor-pointer"
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: styles.textFontSize || "18px",
                  color: "#000",
                }}
                onClick={handleElementClick}
                onDoubleClick={handleDoubleClick}
                onBlur={handleBlur}
                dangerouslySetInnerHTML={{ __html: renderPreview() }}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              <strong>Astuce:</strong> Cliquez sur un élément pour le sélectionner, double-cliquez pour éditer le texte.
              Utilisez Ctrl+Z pour annuler et Ctrl+Y pour rétablir.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="html" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="html-content">Contenu HTML</Label>
            <Textarea
              id="html-content"
              value={htmlContent}
              onChange={(e) => {
                setHtmlContent(e.target.value)
                addToHistory(e.target.value) // Add to history when HTML is directly edited
              }}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Entrez le HTML du template..."
            />
            <p className="text-sm text-muted-foreground">
              Utilisez les variables: {`{{Nom_etudiant}}, {{specialite}}, {{Date}}`}
            </p>
          </div>
        </TabsContent>

        <TabsContent value="styles" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(styles).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key}>{key}</Label>
                <input
                  id={key}
                  type="text"
                  value={value}
                  onChange={(e) => updateStyle(key, e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="preview-name">Nom étudiant</Label>
                <input
                  id="preview-name"
                  type="text"
                  value={previewData.Nom_etudiant}
                  onChange={(e) => setPreviewData((prev) => ({ ...prev, Nom_etudiant: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-specialite">Spécialité</Label>
                <input
                  id="preview-specialite"
                  type="text"
                  value={previewData.specialite}
                  onChange={(e) => setPreviewData((prev) => ({ ...prev, specialite: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-date">Date</Label>
                <input
                  id="preview-date"
                  type="text"
                  value={previewData.Date}
                  onChange={(e) => setPreviewData((prev) => ({ ...prev, Date: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="rounded-lg border bg-white p-8">
              <div
                className="mx-auto max-w-3xl"
                style={{
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: styles.textFontSize || "18px",
                  color: "#000",
                }}
                dangerouslySetInnerHTML={{ __html: renderPreview() }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Sauvegarder
        </Button>
        <Button onClick={handleReset} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" />
          Réinitialiser
        </Button>
        <Button onClick={handleExport} variant="secondary">
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
        <Button variant="secondary" asChild>
          <label className="cursor-pointer">
            <Upload className="mr-2 h-4 w-4" />
            Importer
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </Button>
      </div>

      {saveMessage && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

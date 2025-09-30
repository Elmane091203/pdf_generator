import { TemplatePreview } from "@/components/template-preview"
import { GeneratePDFForm } from "@/components/generate-pdf-form"
import { TemplateEditor } from "@/components/template-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-foreground">Générateur de Diplômes</h1>
          <p className="text-muted-foreground">Prévisualisez le template et générez des diplômes en PDF</p>
        </div>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Aperçu du Template</TabsTrigger>
            <TabsTrigger value="editor">Éditeur de Template</TabsTrigger>
            <TabsTrigger value="generate">Générer des PDFs</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Aperçu du Template</CardTitle>
                <CardDescription>Visualisez le template de diplôme avec des données d'exemple</CardDescription>
              </CardHeader>
              <CardContent>
                <TemplatePreview />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Éditeur de Template</CardTitle>
                <CardDescription>Personnalisez le HTML et les styles de vos templates de diplômes</CardDescription>
              </CardHeader>
              <CardContent>
                <TemplateEditor />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="generate" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Générer des Diplômes</CardTitle>
                <CardDescription>Envoyez les données des étudiants pour générer les PDFs</CardDescription>
              </CardHeader>
              <CardContent>
                <GeneratePDFForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

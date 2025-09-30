import Image from "next/image"

interface DiplomaTemplateProps {
  nom_etudiant: string
  specialite: string
  date_obtention: string
  templateType?: "bep" | "bp" | "bt"
}

export function DiplomaTemplate({
  nom_etudiant,
  specialite,
  date_obtention,
  templateType = "bep",
}: DiplomaTemplateProps) {
  if (templateType === "bp") {
    return <BPTemplate nom_etudiant={nom_etudiant} specialite={specialite} date_obtention={date_obtention} />
  }

  if (templateType === "bt") {
    return <BTTemplate nom_etudiant={nom_etudiant} specialite={specialite} date_obtention={date_obtention} />
  }

  // Default BEP template
  return (
    <div className="relative mx-auto max-w-4xl font-sans">
      {/* Header with logos */}
      <div className="mb-8 flex items-start justify-between">
        <div className="h-32 w-28">
          <Image
            src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/Eg7a33BQ5K2X/images/262.png"
            alt="Logo gauche"
            width={114}
            height={126}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="h-32 w-28">
          <Image
            src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/Y93mOiDba4sb/images/243.png"
            alt="Logo droit"
            width={114}
            height={130}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold text-[#003366]">Brevet d'Etudes Professionnel</h1>

        <p className="text-lg">Ce diplôme est décerné à Mr</p>

        <h2 className="text-3xl font-bold text-[#003366]">{nom_etudiant}</h2>

        <p className="text-lg">pour avoir satisfait aux exigences du programme</p>

        <h3 className="text-2xl font-bold text-[#003366]">{specialite}</h3>

        <p className="text-lg">et avoir démontré les compétences requises pour l'obtention de ce diplôme.</p>

        <div className="py-8" />

        {/* Footer section */}
        <div className="flex items-center justify-between px-8 text-left">
          <div>
            <span className="font-bold">Date de délivrance :</span>{" "}
            {new Date(date_obtention).toLocaleDateString("fr-FR")}
          </div>
          <div>
            <span className="font-bold">Signature :</span>
          </div>
        </div>

        <div className="py-8" />

        {/* Bottom logos */}
        <div className="flex items-center justify-between px-8">
          <div className="h-28 w-32">
            <Image
              src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/dIpDc0bMG8Tm/images/290.png"
              alt="Logo bas gauche"
              width={120}
              height={108}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="h-28 w-24">
            <Image
              src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/NJZPbpDaWmON/images/231.png"
              alt="Logo bas droit"
              width={89}
              height={101}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function BPTemplate({ nom_etudiant, specialite, date_obtention }: Omit<DiplomaTemplateProps, "templateType">) {
  return (
    <div className="relative mx-auto max-w-4xl border-2 border-black p-8 font-sans">
      {/* Header with logos */}
      <div className="mb-8 flex items-start justify-between">
        <div className="h-32 w-28">
          <Image
            src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/b_iG7cZUrvYA/images/262.png"
            alt="Logo gauche"
            width={114}
            height={126}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="h-32 w-28">
          <Image
            src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/Wu95wmI1jtpx/images/243.png"
            alt="Logo droit"
            width={114}
            height={130}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold uppercase text-[#003366]">Brevet Professionnel</h1>

        <p className="text-lg">Ce diplôme est décerné à</p>

        <h2 className="text-3xl font-bold text-[#003366]">{nom_etudiant}</h2>

        <p className="text-lg">pour avoir satisfait aux exigences du programme</p>

        <h3 className="text-2xl font-bold text-[#003366]">{specialite}</h3>

        <p className="text-lg">et avoir démontré les compétences requises pour l'obtention de ce diplôme.</p>

        <div className="py-8" />

        {/* Footer section */}
        <div className="flex items-center justify-center gap-16 text-left">
          <div>
            <span className="font-bold">Date de délivrance :</span>{" "}
            {new Date(date_obtention).toLocaleDateString("fr-FR")}
          </div>
          <div>
            <span className="font-bold">Signature :</span> __________
          </div>
        </div>

        <div className="py-8" />

        {/* Bottom logos */}
        <div className="flex items-center justify-between px-8">
          <div className="h-28 w-32">
            <Image
              src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/6v7mzAvcJR-2/images/290.png"
              alt="Logo bas gauche"
              width={120}
              height={108}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="h-28 w-24">
            <Image
              src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/XVx9c9L3vs28/images/231.png"
              alt="Logo bas droit"
              width={89}
              height={101}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function BTTemplate({ nom_etudiant, specialite, date_obtention }: Omit<DiplomaTemplateProps, "templateType">) {
  return (
    <div className="relative mx-auto max-w-4xl font-sans">
      {/* Header with logos */}
      <div className="mb-8 flex items-start justify-between">
        <div className="h-32 w-28">
          <Image
            src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/ccqJbIy2J7Ec/images/262.png"
            alt="Logo gauche"
            width={114}
            height={126}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="h-32 w-28">
          <Image
            src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/qrlZGopFBiN4/images/243.png"
            alt="Logo droit"
            width={114}
            height={130}
            className="h-full w-full object-contain"
          />
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-6 text-center">
        <h1 className="text-3xl font-bold text-[#003366]">Brevet de Technicien</h1>

        <p className="text-lg">Ce diplôme est décerné à Mr</p>

        <h2 className="text-3xl font-bold text-[#003366]">{nom_etudiant}</h2>

        <p className="text-lg">pour avoir satisfait aux exigences du programme</p>

        <h3 className="text-2xl font-bold text-[#003366]">{specialite}</h3>

        <p className="text-lg">et avoir démontré les compétences requises pour l'obtention de ce diplôme.</p>

        <div className="py-12" />

        {/* Footer section */}
        <div className="flex items-center justify-center gap-24 text-left">
          <div>
            <span className="font-bold">Date de délivrance :</span>{" "}
            {new Date(date_obtention).toLocaleDateString("fr-FR")}
          </div>
          <div>
            <span className="font-bold">Signature :</span>
          </div>
        </div>

        <div className="py-12" />

        {/* Bottom logos */}
        <div className="flex items-center justify-between px-8">
          <div className="h-28 w-32">
            <Image
              src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/pY7Z1Ma1CnHg/images/290.png"
              alt="Logo bas gauche"
              width={120}
              height={108}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="h-28 w-24">
            <Image
              src="https://ckbox.cloud/FZQKcj92QAERbq8DWpqZ/assets/qpvlMYfJ1Olr/images/231.png"
              alt="Logo bas droit"
              width={89}
              height={101}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

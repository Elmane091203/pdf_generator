import Image from "next/image"

interface DiplomaTemplateProps {
  nom_etudiant: string
  specialite: string
  date_obtention: string
}

export function DiplomaTemplate({ nom_etudiant, specialite, date_obtention }: DiplomaTemplateProps) {
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

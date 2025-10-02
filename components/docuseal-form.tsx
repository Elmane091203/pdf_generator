"use client"

import { DocusealForm } from '@docuseal/react'

interface DocuSealFormProps {
  src: string
  email: string
}

export function DocuSealFormComponent({ src, email }: DocuSealFormProps) {
  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden">
      <DocusealForm src={src} email={email} token='CPMhp5phGMMU3wrXsoBRezBS5cDRyPd3c1k8ipJ5vkq'/>
    </div>
  )
}

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ExternalLink, Download, ZoomIn, ZoomOut, RotateCw,
  FileText, Image as ImageIcon, AlertCircle, Loader2
} from "lucide-react"
import type { AgentDocument, VerificationStatus } from "@/types/agent"
import { format } from "date-fns"

interface DocumentViewerDialogProps {
  document: AgentDocument | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const verificationStatusVariant: Record<VerificationStatus, "default" | "secondary" | "destructive"> = {
  'verified': "default",
  'pending': "secondary",
  'rejected': "destructive",
}

export default function DocumentViewerDialog({
  document,
  isOpen,
  onOpenChange,
}: DocumentViewerDialogProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (!document) return null

  const isPdf = document.document_url.toLowerCase().endsWith('.pdf')
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(document.document_url)

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const resetView = () => {
    setZoom(100)
    setRotation(0)
    setIsLoading(true)
    setHasError(false)
  }

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) resetView()
        onOpenChange(open)
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                <span className="flex items-center gap-2">
                  {isPdf ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <ImageIcon className="h-5 w-5" />
                  )}
                  {document.document_type_display}
                </span>
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={verificationStatusVariant[document.verification_status]}>
                  {document.verification_status_display}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Uploaded {format(new Date(document.uploaded_at), "PPp")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isImage && (
                <>
                  <Button variant="ghost" size="icon" onClick={handleZoomOut} title="Zoom Out">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm w-12 text-center">{zoom}%</span>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn} title="Zoom In">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleRotate} title="Rotate">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" asChild title="Open in new tab">
                <a href={document.document_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" asChild title="Download">
                <a href={document.document_url} download>
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Document Info */}
        {document.rejection_reason && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
            <strong>Rejection Reason:</strong> {document.rejection_reason}
          </div>
        )}

        {document.verified_at && (
          <div className="text-xs text-muted-foreground">
            {document.verification_status === 'verified' ? 'Verified' : 'Reviewed'} on{' '}
            {format(new Date(document.verified_at), "PPp")}
            {document.verified_by_email && ` by ${document.verified_by_email}`}
          </div>
        )}

        {/* Document Viewer */}
        <div className="flex-1 min-h-[400px] bg-muted rounded-lg overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-4">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Failed to load document</p>
              <Button variant="outline" asChild>
                <a href={document.document_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
            </div>
          )}

          {isPdf ? (
            /* PDF Viewer using iframe */
            <iframe
              src={`${document.document_url}#toolbar=1&navpanes=0`}
              className="w-full h-full min-h-[500px]"
              title={document.document_type_display}
              onLoad={handleLoad}
              onError={handleError}
              style={{ display: hasError ? 'none' : 'block' }}
            />
          ) : isImage ? (
            /* Image Viewer */
            <div 
              className="w-full h-full min-h-[500px] overflow-auto flex items-center justify-center p-4"
              style={{ display: hasError ? 'none' : 'flex' }}
            >
              <img
                src={document.document_url}
                alt={document.document_type_display}
                className="max-w-full transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
                onLoad={handleLoad}
                onError={handleError}
              />
            </div>
          ) : (
            /* Unknown file type */
            <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center gap-4">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground">
                Preview not available for this file type
              </p>
              <Button variant="outline" asChild>
                <a href={document.document_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

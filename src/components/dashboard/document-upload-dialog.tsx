'use client'

import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Upload, FileText, X, Loader2, AlertCircle, CheckCircle 
} from "lucide-react"
import { AgentService } from "@/services/agent"
import { UploadService } from "@/services/upload"
import type { DocumentType } from "@/types/agent"
import { showError, showSuccess } from "@/lib/toast-helpers"

interface DocumentUploadDialogProps {
  agentId: number
  agentName: string
  existingDocTypes: DocumentType[]
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSuccess: () => void
}

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'driving_license', label: 'Driving License' },
]

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function DocumentUploadDialog({
  agentId,
  agentName,
  existingDocTypes,
  isOpen,
  onOpenChange,
  onSuccess,
}: DocumentUploadDialogProps) {
  const [documentType, setDocumentType] = useState<DocumentType | ''>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentUrl, setDocumentUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('url')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get available document types (exclude already uploaded ones)
  const availableDocTypes = DOCUMENT_TYPES.filter(
    dt => !existingDocTypes.includes(dt.value)
  )

  const resetForm = () => {
    setDocumentType('')
    setSelectedFile(null)
    setDocumentUrl('')
    setIsUploading(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!UploadService.isValidFileType(file, ALLOWED_FILE_TYPES)) {
      showError('Invalid file type. Please upload PDF, JPEG, PNG, or WebP files.')
      return
    }

    // Validate file size
    if (!UploadService.isValidFileSize(file, MAX_FILE_SIZE)) {
      showError(`File too large. Maximum size is ${UploadService.formatFileSize(MAX_FILE_SIZE)}.`)
      return
    }

    setSelectedFile(file)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!documentType) {
      showError('Please select a document type')
      return
    }

    let finalUrl = documentUrl

    // If file mode and file selected, upload first
    if (uploadMode === 'file' && selectedFile) {
      setIsUploading(true)
      try {
        const uploadResult = await UploadService.uploadFile(
          selectedFile,
          `agents/${agentId}/documents`
        )
        finalUrl = uploadResult.url
      } catch (error: any) {
        showError(error.message || 'Failed to upload file')
        setIsUploading(false)
        return
      }
    }

    if (!finalUrl) {
      showError('Please provide a document URL or upload a file')
      setIsUploading(false)
      return
    }

    // Now upload the document record
    setIsUploading(true)
    try {
      await AgentService.uploadDocument(agentId, {
        document_type: documentType,
        document_url: finalUrl,
      })
      showSuccess('Document uploaded successfully')
      handleClose()
      onSuccess()
    } catch (error: any) {
      showError(error.message || 'Failed to upload document')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a verification document for {agentName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Document Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type</Label>
            {availableDocTypes.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">All required documents have been uploaded</span>
              </div>
            ) : (
              <Select
                value={documentType}
                onValueChange={(value) => setDocumentType(value as DocumentType)}
              >
                <SelectTrigger id="document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {availableDocTypes.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {availableDocTypes.length > 0 && (
            <>
              {/* Upload Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={uploadMode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('url')}
                >
                  Enter URL
                </Button>
                <Button
                  type="button"
                  variant={uploadMode === 'file' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUploadMode('file')}
                  disabled // Disabled until file upload endpoint is ready
                  title="File upload coming soon"
                >
                  Upload File
                </Button>
              </div>

              {uploadMode === 'url' ? (
                /* URL Input */
                <div className="space-y-2">
                  <Label htmlFor="document-url">Document URL</Label>
                  <Input
                    id="document-url"
                    type="url"
                    placeholder="https://example.com/document.pdf"
                    value={documentUrl}
                    onChange={(e) => setDocumentUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the URL of the document (PDF or image)
                  </p>
                </div>
              ) : (
                /* File Upload */
                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div
                    className={`
                      border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                      transition-colors
                      ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                      ${selectedFile ? 'bg-green-50 border-green-300' : ''}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={handleFileInputChange}
                    />
                    
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-8 w-8 text-green-600" />
                        <div className="text-left">
                          <p className="font-medium text-green-700">{selectedFile.name}</p>
                          <p className="text-xs text-green-600">
                            {UploadService.formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFile(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Drag and drop or click to upload
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, JPEG, PNG, WebP (max 10MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isUploading || availableDocTypes.length === 0 || !documentType}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

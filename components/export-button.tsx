'use client'

import { useState } from 'react'
import { Download, Copy, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export interface ExportButtonProps {
  content: string
  filename?: string
}

export function ExportButton({ content, filename = 'export' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy to clipboard')
      console.error('[v0] Copy error:', err)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      setLoading(true)

      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      // Get page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - margin * 2

      // Add title
      pdf.setFontSize(16)
      pdf.setTextColor(40, 40, 40)
      const title = `Export - ${new Date().toLocaleDateString()}`
      pdf.text(title, margin, margin + 10)

      // Add horizontal line under title
      pdf.setLineWidth(0.5)
      pdf.setDrawColor(200, 200, 200)
      pdf.line(margin, margin + 15, pageWidth - margin, margin + 15)

      // Add content
      pdf.setFontSize(11)
      pdf.setTextColor(60, 60, 60)
      const textLines = pdf.splitTextToSize(content, contentWidth)

      let yPosition = margin + 25
      const lineHeight = 5.5
      const maxLinesPerPage = Math.floor(
        (pageHeight - margin * 2 - 20) / lineHeight
      )

      let lineCount = 0
      for (const line of textLines) {
        if (lineCount >= maxLinesPerPage) {
          pdf.addPage()
          yPosition = margin
          lineCount = 0
        }

        pdf.text(line, margin, yPosition)
        yPosition += lineHeight
        lineCount++
      }

      // Add footer with timestamp
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      const footerText = `Generated on ${new Date().toLocaleString()}`
      pdf.text(footerText, margin, pageHeight - 10)

      // Download the PDF
      pdf.save(`${filename}.pdf`)
      toast.success('PDF downloaded successfully')
    } catch (err) {
      toast.error('Failed to generate PDF')
      console.error('[v0] PDF generation error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || !content}
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden sm:inline">Generating...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyToClipboard} disabled={loading}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy to clipboard</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadPDF} disabled={loading}>
          <FileText className="mr-2 h-4 w-4" />
          <span>Download as PDF</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

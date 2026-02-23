'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

interface WebcamMonitorProps {
  enrollmentId: string
  enabled: boolean
}

export function WebcamMonitor({ enrollmentId, enabled }: WebcamMonitorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [videoChunks, setVideoChunks] = useState<Blob[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    if (!enabled) return

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // Start recording
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm',
        })

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            setVideoChunks((prev) => [...prev, e.data])
          }
        }

        mediaRecorder.start(5000) // Record in 5-second chunks
        mediaRecorderRef.current = mediaRecorder
        setIsRecording(true)

        toast.success('Webcam monitoring started')
      } catch (error) {
        console.error('Error accessing webcam:', error)
        toast.error('Unable to access webcam. Please grant camera permission.')
      }
    }

    startWebcam()

    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }

      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [enabled])

  if (!enabled) {
    return null
  }

  return (
    <Card className="fixed bottom-4 right-4 w-64 shadow-lg">
      <CardContent className="p-2">
        <div className="space-y-2">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-48 object-cover"
            />
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
              REC
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
          <p className="text-xs text-slate-600 text-center">
            {isRecording ? 'Recording...' : 'Initializing...'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

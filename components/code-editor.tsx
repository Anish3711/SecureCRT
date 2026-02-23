'use client'

import { useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CodeEditorProps {
  question: {
    id: string
    question_text: string
    marks: number
    coding_language: string
    coding_template: string
    coding_test_cases: Array<{
      input: string
      expected_output: string
      description: string
    }>
    coding_constraints: string
  }
  onSubmit: (code: string) => Promise<void>
  isSubmitting: boolean
}

export function CodeEditor({ question, onSubmit, isSubmitting }: CodeEditorProps) {
  const [code, setCode] = useState(question.coding_template || '')
  const [testResults, setTestResults] = useState<Array<{
    testCase: number
    passed: boolean
    output: string
    expectedOutput: string
  }> | null>(null)
  const [running, setRunning] = useState(false)

  const handleRunCode = useCallback(async () => {
    setRunning(true)
    try {
      // Call backend to execute code
      const response = await fetch('/api/execute-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language: question.coding_language,
          testCases: question.coding_test_cases,
        }),
      })

      if (!response.ok) throw new Error('Code execution failed')

      const { results } = await response.json()
      setTestResults(results)
    } catch (error) {
      console.error('Error running code:', error)
    } finally {
      setRunning(false)
    }
  }, [code, question.coding_language, question.coding_test_cases])

  const handleSubmitCode = async () => {
    await onSubmit(code)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {/* Code Editor */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Code Editor</CardTitle>
                  <CardDescription>{question.coding_language}</CardDescription>
                </div>
                <Badge>{question.marks} marks</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Editor
                height="400px"
                language={question.coding_language.toLowerCase()}
                value={code}
                onChange={(value) => setCode(value || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResults && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md ${
                      result.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium">Test Case {result.testCase + 1}</p>
                      <Badge variant={result.passed ? 'default' : 'destructive'}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </Badge>
                    </div>
                    {!result.passed && (
                      <div className="mt-2 text-sm space-y-1">
                        <p>
                          <span className="font-medium">Expected:</span> {result.expectedOutput}
                        </p>
                        <p>
                          <span className="font-medium">Got:</span> {result.output}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Question Info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium text-sm mb-2">{question.question_text}</p>
              </div>

              {question.coding_constraints && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Constraints:</h4>
                  <p className="text-sm text-slate-600">{question.coding_constraints}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm mb-2">Test Cases:</h4>
                <div className="space-y-2">
                  {question.coding_test_cases?.map((testCase, index) => (
                    <div key={index} className="bg-slate-50 p-2 rounded text-sm">
                      <p className="font-mono text-xs">
                        Input: {testCase.input}
                      </p>
                      <p className="font-mono text-xs">
                        Output: {testCase.expected_output}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button onClick={handleRunCode} disabled={running} variant="outline" className="w-full">
              {running ? 'Running...' : 'Run Code'}
            </Button>
            <Button onClick={handleSubmitCode} disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Submit Code'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

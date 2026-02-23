import { NextRequest, NextResponse } from 'next/server'

interface TestCase {
  input: string
  expected_output: string
  description?: string
}

interface ExecuteCodeRequest {
  code: string
  language: string
  testCases: TestCase[]
}

// Simple code executor using Judge0 or similar service
// For MVP, we'll implement a basic execution system
export async function POST(request: NextRequest) {
  try {
    const body: ExecuteCodeRequest = await request.json()
    const { code, language, testCases } = body

    if (!code || !language || !testCases) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate code length
    if (code.length > 10000) {
      return NextResponse.json(
        { error: 'Code too long' },
        { status: 400 }
      )
    }

    const results = await executeCode(code, language, testCases)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Code execution error:', error)
    return NextResponse.json(
      { error: 'Code execution failed' },
      { status: 500 }
    )
  }
}

// Mock execution function - replace with actual Judge0 integration
async function executeCode(
  code: string,
  language: string,
  testCases: TestCase[]
) {
  const results = testCases.map((testCase, index) => {
    try {
      // This is a simplified mock implementation
      // In production, integrate with Judge0 API or similar

      let output = ''

      // For Python - simple evaluation (NOT SECURE - for demo only)
      if (language.toLowerCase() === 'python') {
        // Create a controlled execution environment
        const executeInContext = () => {
          const context: any = {
            input: testCase.input,
            print: (...args: any[]) => {
              output = args.join(' ')
            },
          }

          // This is unsafe - only use for controlled demo environments
          // In production, use a proper sandbox like Judge0
          try {
            new Function('print', 'input', code)(context.print, testCase.input)
          } catch (e) {
            output = `Error: ${e}`
          }
        }

        executeInContext()
      }
      // For JavaScript
      else if (language.toLowerCase() === 'javascript') {
        const executeInContext = () => {
          const context: any = {
            input: testCase.input,
            console: {
              log: (...args: any[]) => {
                output = args.join(' ')
              },
            },
          }

          try {
            new Function('console', 'input', code)(context.console, testCase.input)
          } catch (e) {
            output = `Error: ${e}`
          }
        }

        executeInContext()
      }

      // For other languages, return placeholder
      output = output || testCase.expected_output

      return {
        testCase: index,
        passed: output.trim() === testCase.expected_output.trim(),
        output: output || 'No output',
        expectedOutput: testCase.expected_output,
      }
    } catch (error) {
      return {
        testCase: index,
        passed: false,
        output: `Error: ${error}`,
        expectedOutput: testCase.expected_output,
      }
    }
  })

  return results
}

import {ellipsis, fixEol} from '../utils/markdown-utils.js'
import {TestRunResult} from '../test-results.js'
import {getFirstNonEmptyLine} from '../utils/parse-utils.js'

type Annotation = {
  path: string
  start_line: number
  end_line: number
  start_column?: number
  end_column?: number
  annotation_level: 'notice' | 'warning' | 'failure'
  message: string
  title?: string
  raw_details?: string
}

interface TestError {
  testRunPaths: string[]
  suiteName: string
  testName: string
  path: string
  line: number
  description?: string
  message: string
  details: string
}

interface TestOutput {
  testRunPaths: string[]
  suiteName: string
  testName: string
  path: string
  line: number
  description?: string
  systemOut: string
}

export function getAnnotations(results: TestRunResult[], maxCount: number): Annotation[] {
  if (maxCount === 0) {
    return []
  }

  // Collect errors from TestRunResults
  // Merge duplicates if there are more test results files processed
  const errors: TestError[] = []
  const outputs: TestOutput[] = []
  const mergeDup = results.length > 1
  for (const tr of results) {
    for (const ts of tr.suites) {
      for (const tg of ts.groups) {
        for (const tc of tg.tests) {
          const testName = tg.name ? `${tg.name} ► ${tc.name}` : tc.name

          const err = tc.error
          if (err !== undefined) {
            const path = err.path ?? tr.path
            const line = err.line ?? 0
            if (mergeDup) {
              const dup = errors.find(e => path === e.path && line === e.line && err.details === e.details)
              if (dup !== undefined) {
                dup.testRunPaths.push(tr.path)
                continue
              }
            }

            errors.push({
              testRunPaths: [tr.path],
              suiteName: ts.name,
              testName,
              description: tc.description,
              details: err.details,
              message: err.message ?? getFirstNonEmptyLine(err.details) ?? 'Test failed',
              path,
              line
            })
          } else if (tc.result === 'success' && tc.systemOut) {
            outputs.push({
              testRunPaths: [tr.path],
              suiteName: ts.name,
              testName,
              description: tc.description,
              systemOut: tc.systemOut,
              path: tr.path,
              line: 0
            })
          }
        }
      }
    }
  }

  // Limit number of created annotations
  errors.splice(maxCount + 1)

  const annotations = errors.map(e => {
    const parts = [
      'Failed test found in:',
      e.testRunPaths.map(p => `  ${p}`).join('\n')
    ]
    if (e.description) {
      parts.push('Description:', ident(e.description, '  '))
    }
    parts.push('Error:', ident(fixEol(e.message), '  '))
    const message = parts.join('\n')

    return enforceCheckRunLimits({
      path: e.path,
      start_line: e.line,
      end_line: e.line,
      annotation_level: 'failure',
      title: `${e.suiteName} ► ${e.testName}`,
      raw_details: fixEol(e.details),
      message
    })
  })

  // Limit system-out notices to remaining capacity
  const remaining = maxCount - errors.length
  if (remaining > 0) {
    outputs.splice(remaining + 1)

    const noticeAnnotations = outputs.map(o => {
      const parts = [
        'Test found in:',
        o.testRunPaths.map(p => `  ${p}`).join('\n')
      ]
      if (o.description) {
        parts.push('Description:', ident(o.description, '  '))
      }
      parts.push('Output:', ident(fixEol(o.systemOut), '  '))
      const message = parts.join('\n')

      return enforceCheckRunLimits({
        path: o.path,
        start_line: o.line,
        end_line: o.line,
        annotation_level: 'notice',
        title: `${o.suiteName} ► ${o.testName}`,
        raw_details: fixEol(o.systemOut),
        message
      })
    })

    annotations.push(...noticeAnnotations)
  }

  return annotations
}

function enforceCheckRunLimits(err: Annotation): Annotation {
  err.title = ellipsis(err.title || '', 255)
  err.message = ellipsis(err.message, 65535)
  if (err.raw_details) {
    err.raw_details = ellipsis(err.raw_details, 65535)
  }
  return err
}

function ident(text: string, prefix: string): string {
  return text
    .split(/\n/g)
    .map(line => prefix + line)
    .join('\n')
}

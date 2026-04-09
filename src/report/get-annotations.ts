import {ellipsis, fixEol} from '../utils/markdown-utils'
import {TestRunResult} from '../test-results'
import {getFirstNonEmptyLine} from '../utils/parse-utils'

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
  message: string
  details: string
}

interface TestNotice {
  suiteName: string
  testName: string
  path: string
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
  const notices: TestNotice[] = []
  const mergeDup = results.length > 1
  for (const tr of results) {
    for (const ts of tr.suites) {
      for (const tg of ts.groups) {
        for (const tc of tg.tests) {
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
              testName: tg.name ? `${tg.name} ► ${tc.name}` : tc.name,
              details: err.details,
              message: err.message ?? getFirstNonEmptyLine(err.details) ?? 'Test failed',
              path,
              line
            })
          } else if (tc.result === 'success' && tc.systemOut) {
            notices.push({
              suiteName: ts.name,
              testName: tg.name ? `${tg.name} ► ${tc.name}` : tc.name,
              path: tr.path,
              description: tc.description,
              systemOut: tc.systemOut
            })
          }
        }
      }
    }
  }

  // Limit number of created annotations
  errors.splice(maxCount + 1)

  const failureAnnotations = errors.map(e => {
    const message = [
      'Failed test found in:',
      e.testRunPaths.map(p => `  ${p}`).join('\n'),
      'Error:',
      ident(fixEol(e.message), '  ')
    ].join('\n')

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

  const noticeAnnotations = notices.map(n => {
    const titleSuffix = n.description ? `: ${n.description}` : ''
    const messageParts = []
    if (n.description) {
      messageParts.push(n.description)
    }
    messageParts.push(fixEol(n.systemOut))

    return enforceCheckRunLimits({
      path: n.path,
      start_line: 0,
      end_line: 0,
      annotation_level: 'notice',
      title: `${n.suiteName} ► ${n.testName}${titleSuffix}`,
      message: messageParts.join('\n')
    })
  })

  return [...failureAnnotations, ...noticeAnnotations]
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

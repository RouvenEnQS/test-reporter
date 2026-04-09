import * as fs from 'fs'
import * as path from 'path'

import {DotnetNunitLegacyParser} from '../src/parsers/dotnet-nunit-legacy/dotnet-nunit-legacy-parser'
import {ParseOptions} from '../src/test-parser'
import {getReport} from '../src/report/get-report'
import {normalizeFilePath} from '../src/utils/path-utils'

describe('dotnet-nunit-legacy tests', () => {
  it('report from ./reports/dotnet test results matches snapshot', async () => {
    const fixturePath = path.join(__dirname, 'fixtures', 'dotnet-nunit-legacy.xml')
    const outputPath = path.join(__dirname, '__outputs__', 'dotnet-nunit-legacy.md')
    const filePath = normalizeFilePath(path.relative(__dirname, fixturePath))
    const fileContent = fs.readFileSync(fixturePath, {encoding: 'utf8'})

    const opts: ParseOptions = {
      parseErrors: true,
      trackedFiles: ['MyLibrary/Calculator.cs', 'NUnitLegacyTests/CalculatorTests.cs']
    }

    const parser = new DotnetNunitLegacyParser(opts)
    const result = await parser.parse(filePath, fileContent)
    expect(result).toMatchSnapshot()

    const report = getReport([result])
    fs.mkdirSync(path.dirname(outputPath), {recursive: true})
    fs.writeFileSync(outputPath, report)
  })
})

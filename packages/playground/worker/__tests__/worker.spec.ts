import fs from 'fs'
import path from 'path'
import { untilUpdated, isBuild, testDir } from '../../testUtils'

test('normal', async () => {
  await page.click('.ping')
  await untilUpdated(() => page.textContent('.pong'), 'pong')
  await untilUpdated(
    () => page.textContent('.mode'),
    isBuild ? 'production' : 'development'
  )
})

test('inlined', async () => {
  await page.click('.ping-inline')
  await untilUpdated(() => page.textContent('.pong-inline'), 'pong')
})

if (isBuild) {
  // assert correct files
  test('inlined code generation', async () => {
    const assetsDir = path.resolve(testDir, 'dist/assets')
    const files = fs.readdirSync(assetsDir)
    // should have only 1 worker chunk
    expect(files.length).toBe(2)
    const index = files.find((f) => f.includes('index'))
    const content = fs.readFileSync(path.resolve(assetsDir, index), 'utf-8')
    const worker = files.find((f) => f.includes('my-worker'))
    const workerContent = fs.readFileSync(
      path.resolve(assetsDir, worker),
      'utf-8'
    )

    // worker should have all imports resolved and no exports
    expect(workerContent).not.toMatch(`import`)
    expect(workerContent).not.toMatch(`export`)
    // chunk
    expect(content).toMatch(`new Worker("/assets`)
    // inlined
    expect(content).toMatch(`new Worker("data:application/javascript`)
  })
}

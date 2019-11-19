import assert from 'assert'
import { loadConfig } from '../../src/loader'

describe('Load Config Tests', () => {
  const cfgFile = (rel: string) => `${__dirname}/cfg/${rel}`

  it('Should load c1 config', () => {
    const cfg = loadConfig(cfgFile('c1.js'), { NotImportantParam: 'one' }, { stackName: 'yeah' })
    assert.ok(cfg)
    assert.equal('yeah', cfg.stackName)
  })

  it('Should load c1-fn config', () => {
    const cfg = loadConfig(cfgFile('c1-fn.js'), { ExtParam: 'p1' })
    assert.equal('p1', cfg.ExtParam)
  })

  it('Should load basic config', () => {
    const cfg = loadConfig(cfgFile('basic.js'), { Env: 'prod' })
    assert.equal('stack-prod', cfg.stackName)
  })

  it('Should load basic with default', () => {
    const cfg = loadConfig(cfgFile('basic.js'), {})
    assert.equal('stack-dev', cfg.stackName)
  })
  
})
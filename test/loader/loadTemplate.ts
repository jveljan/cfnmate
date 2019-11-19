import assert from 'assert'
import { loadTemplate } from '../../src/loader'

describe('Load Tempalte Tests', () => {
  const cfgCtx = 'test/loader/cfg/config.file'

  it('Should load c1 config', async () => {
    const t1 = await loadTemplate(`${__dirname}/tpl/t1.yml`)
    assert.ok(t1)
    console.log(t1)
    assert.equal('bval', t1.a.b)
    assert.equal(2, t1.a.arr.length)
  })
})
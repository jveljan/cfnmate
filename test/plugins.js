const assert = require('assert')
const plugins = require('../plugins')


describe('Tests for plugins', () => {

  it('resourceTransform', async () => {
    const doc = {
      Resources: {
        DirectReplacement: 10,
        TaskDef: {
          Properties: {}
        }
      }
    }

    const cfg = {
      nonExistingFn() {
        return 'nef'
      },
      nonExistingProp: 'nep',
      TaskDef({ Properties }) {
        Properties.Sample = 10
      },
      DirectReplacement: 20
    }

    await plugins.resourceTransform(cfg).preDeployTransform(doc)
    assert.equal(doc.Resources.TaskDef.Properties.Sample, 10)
    assert.equal(doc.Resources.DirectReplacement, 20)
    assert.equal(doc.Resources.nonExistingFn, 'nef')
    assert.equal(doc.Resources.nonExistingProp, 'nep')
  })

})
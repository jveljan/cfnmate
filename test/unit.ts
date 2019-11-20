import assert from 'assert'
import { CfnTemplate } from "../src/CfnTemplate"
import { mergedParams, pluginsRunner, runCfnDeploy } from "../src/cfnmate"

describe('Unit Tests', () => {
  const tpl = new CfnTemplate({
    Parameters: {
      Env: {
        Type: 'String',
        Default: 'dev'
      },
      NoDefault: {},
      DefOvr: {
        Default: '1'
      }
    }
  })

  it('mergedParams', () => {
    const params = mergedParams(tpl, { Name: 'Joco', DefOvr: 2 })
    assert.ok(params)
    assert.equal('dev', params.Env)
    assert.equal('Joco', params.Name)
    assert.equal(2, params.DefOvr)
    assert.equal(params.NoDefault, undefined)
  })


  it('DeployableTemplate.validateWithParams success', () => {
    tpl.validateWithParams({
      NoDefault: 0
    })
  })

  it('DeployableTemplate.validateWithParams empty success', () => {
    new CfnTemplate({
    }).validateWithParams({})
  })
  
  it('DeployableTemplate.validateWithParams fail', () => {
    try {
      tpl.validateWithParams({})
      assert.fail('Passed here, above is invalid input')
    } catch (e) {
      assert.ok(e)
    }
  })

  it('pluginsRunner', async () => {
    const argCounter = {
      notify: (...args: any[]) => args.length
    }
    const echo = {
      notify: (arg: any) => arg
    }
    const doNothing = {
      dunmmy() { }
    }
    const runner = pluginsRunner([argCounter, echo, doNothing])
    const r = await runner('notify', 1, 2, 3, 4)
    assert.equal(4, r[0])
    assert.equal(1, r[1])
    assert.ok(r[2].error)
  })


  it('runCfnDeploy', async () => {
    const plugins = [{
      beforeDeploy(data: string) {
        console.log(data)
      }
    }]
    const result = await runCfnDeploy('[data]', {
      dryRun: true,
      stackName: 'staack',
      plugins
    })
    assert.equal(0, result)
  })
})
import fs from 'fs'
import { file as tmpfile } from 'tmp-promise'
import { loadConfig, loadTemplate, resolvePath, resolvePathRelativeTo } from './loader'
import { CfnTemplate } from './CfnTemplate'
import ProcRunner from './ProcRunner'
import { yamlDump } from 'yaml-cfn'

/**
 * Loads config with merged params from input and document default params
 */
export async function cmdDeploy(template: string, inputParams: any, args?: string[], cfmateConfigFile?: string, configOverrides?: any) {
  const templateAbsPath = resolvePath(template)
  const tpl = await loadTemplate(templateAbsPath)
  const doc = new CfnTemplate(tpl)
  const configAbsPath = resolvePathRelativeTo(templateAbsPath, cfmateConfigFile || 'cfnmate.config.js')
  const cfg = loadConfig(configAbsPath, mergedParams(doc, inputParams), configOverrides)
  return deploy(doc, cfg, inputParams)
}

export async function deploy(doc: CfnTemplate, cfg: CfnMateConfig, inputParams: Dictionary, args?: string[]) {
  const parameterOverrides = Object.assign({}, inputParams, cfg.params)
  doc.validateWithParams(parameterOverrides)

  const pluginsRun = pluginsRunner(cfg.plugins || [])
  // plugins
  await pluginsRun('applyTransform', doc.document)
  const tplData = yamlDump(doc.document)
  await pluginsRun('beforeDeploy', tplData, cfg, parameterOverrides, args)
  const result = await runCfnDeploy(tplData, cfg, parameterOverrides, args)
  await pluginsRun('afterDeploy', result, tplData)
  return result
}

export function mergedParams(doc: CfnTemplate, inputParams: any) {
  const arg: any = {}
  Object.keys(doc.Parameters).forEach(k => {
    const defaultValue = doc.Parameters[k].Default
    if (defaultValue != null || defaultValue != undefined) {
      arg[k] = doc.Parameters[k].Default
    }
  })
  Object.keys(inputParams).forEach(k => {
    arg[k] = inputParams[k]
  })
  return arg
}



export function pluginsRunner(plugins: any[]) {
  return async (fn: string, ...args: any) => {
    const results = []
    for (let i = 0; i < plugins.length; i++) {
      if (typeof plugins[i][fn] == 'function') {
        const result = await plugins[i][fn](...args)
        results.push(result)
      } else {
        results.push({
          error: `Unable to run ${fn} in plugin ${plugins[i].name || 'plugin-index-' + i}`,
          plugin: plugins[i]
        })
      }
    }
    return results
  }
}

export async function runCfnDeploy(tplData: string, cfg: any, parameterOverrides?: Dictionary, additionalParams?: string[]) {
  const { path, cleanup } = await tmpfile()
  try {
    await fs.promises.writeFile(path, tplData)
    const aws = new ProcRunner('aws', cfg.dryRun, cfg.debug)
    aws.addArg('cloudformation')
    aws.addArg('deploy')
    aws.addKeyValue('--stack-name', cfg.stackName)
    aws.addKeyValue('--template-file', path)
    aws.addKeyValue('--parameter-overrides', parameterOverrides)
    aws.addKeyValue('--capabilities', cfg.capabilities)
    aws.addKeyValue('--tags', cfg.tags)
    aws.addAll(additionalParams)
    return await aws.run()
  } finally {
    cleanup()
  }
}
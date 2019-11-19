import path from 'path'
import fs from 'fs'
import { yamlParse } from 'yaml-cfn'

export const resolvePath = (file: string) => path.isAbsolute(file) ? file : path.join(process.cwd(), file)
export const extractIfFn = (maybeFn: any, ...args: any) => typeof maybeFn == 'function' ? maybeFn(...args) : maybeFn
export const resolvePathRelativeTo = (file: string, name: string) => path.join(path.dirname(resolvePath(file)), name)

/**
 * Resolved configuration merged with params
 */
export function loadConfig(absConfigPath: string, params: Dictionary, overrides = {}) {
  const mdl = require(absConfigPath)
  const moduleExtractedConfig = extractIfFn(mdl, params)
  const config: CfnMateConfig = Object.assign({
    debug: false,
    dryRun: false
  }, moduleExtractedConfig, overrides)
  return config
}

/**
 * Returns valid yaml context document
 */
export async function loadTemplate(templateAbsPath: string) {
  const data = await fs.promises.readFile(templateAbsPath, 'utf-8')
  return yamlParse(data)
}
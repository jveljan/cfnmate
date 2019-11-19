interface CfnTemplateParameter {
  Type: string
  Default?: any,
  Description?: string
}

interface Dictionary {
  [key: string]: string
}


interface CfnMatePlugin {
  applyTransform(templateRoot:any):Promise<void>
  beforeDeploy(params:any, tplData: String): Promise<void>
  afterDeploy(result: any, tplData: String): Promise<void>
}

interface CfnMateConfig {
  stackName: string
  params?: Dictionary
  tags?: Dictionary
  capabilities?: string
  debug: boolean
  dryRun: boolean
  plugins?: CfnMatePlugin[]
  [key: string]: any
}
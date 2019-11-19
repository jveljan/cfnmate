export class CfnTemplate {
  // root node of the document
  document: any

  constructor(document: any) {
    this.document = document
  }

  get AWSTemplateFormatVersion() {
    return this.document.AWSTemplateFormatVersion
  }
  get Description() {
    return this.document.Description
  }
  get Metadata() {
    return this.document.Metadata
  }
  get Parameters(): { [key: string]: CfnTemplateParameter } {
    return this.document.Parameters
  }
  get Mappings() {
    return this.document.Mappings
  }
  get Transform() {
    return this.document.Transform
  }
  get Conditions() {
    return this.document.Conditions
  }
  get Resources() {
    return this.document.Resources
  }
  get Outputs() {
    return this.document.Outputs
  }

  validateWithParams(params: any) {
    const isNullOrUndefined = (v: any) => (v === null || v === undefined)

    const missing = Object.keys(this.Parameters)
      .filter(k =>
        isNullOrUndefined(this.Parameters[k].Default)
        &&
        isNullOrUndefined(params[k]))
    if (missing.length > 0) {
      throw `Missing required parameters: "${missing}"`
    }
  }
}

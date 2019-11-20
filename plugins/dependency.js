const { cfnmate, loader } = require('../dist/main')

module.exports = (cfnmateTemplateFile, params, cfnmateConfigFile, configOverrides) => ({
  beforeDeploy() {
    console.log(cfnmateTemplateFile, params)
    return cfnmate.cmdDeploy(cfnmateTemplateFile, params, [], cfnmateConfigFile, configOverrides)
  }
})
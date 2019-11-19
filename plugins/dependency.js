const { cfnbuddy, loader } = require('../dist/main')

module.exports = (cfnbuddyTemplateFile, params, cfnbuddyConfigFile, configOverrides) => ({
  beforeDeploy() {
    return cfnbuddy.cmdDeploy(cfnbuddyTemplateFile, params, [], cfnbuddyConfigFile, configOverrides)
  }
})
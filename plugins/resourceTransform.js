/**
 * Exposes Resources from template and passes to a transformer function
 * eg usage in cfnmate config:
 * 
 plugins: [ ... 
    resourceTransform({
      TaskDef({ Properties }) {
        Properties.ContainerDefinitions[0].Environment = [{
          Key: 'SPRING_SERVER_PORT',
          Value: 8090
        }]
      }
    })
*/
module.exports = (cfg) => ({
  async applyTransform(doc) {
    const keys = Object.keys(cfg)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const resource = doc.Resources[key]
      if (!resource) {
        console.warn(`Resource "${key}" not found`)
      }
      if (typeof cfg[key] === 'function') {
        const result = await cfg[key](resource)
        if (!resource) {
          doc.Resources[key] = result
        }
      } else {
        doc.Resources[key] = cfg[key]
      }
    }
  }
})

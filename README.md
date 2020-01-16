# cfnmate

Describe and deploy cloudformatnion tempaltes with flexibility to apply scripted transformatnions.

- Better control for conditional resources
- Dependency management
- Template transformations
- No more !If inside a template

# Install
```
npm install cfnmate
npx cfnmate --help
```
# cfnmate needs cfnmate.config.js - a descriptor to deploy stack

# Basic Example 
Prepare dir with:
  - my-template.yaml that needs parameter "Env"
  - cfnmate.config.js
```
module.exports = (params) => ({
  stackName: `my-stack-${params.Env}`
})
```
Command:
```
cfnmate deploy my-template.yaml Env=dev
```

# Apply template transformations
```
const { resourceTransform } = require('cfnmate/plugins')
module.exports = ({ Env, Bucket, Version }) => ({
  stackName: `my-stack-${Env}`,
  plugins: [
    resourceTransform({
      LambdaFunction({ Properties }) {
        Properties.Code = {
          S3Bucket: `${Bucket}-${Env}`,
          S3Key: Version
        }
      }
    })
  ]
})
```
Command:
```
cfnmate deploy my-template.yaml Env=dev Bucket=my-bucket Version=1.0
```

# Dependency - deploy another stack before yours
```
plugins: [
  dependency('../path/to/another/template.taml', {
    ParamForDependency: 'value'
  })
]
```


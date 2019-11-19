module.exports = ({ Env = 'dev', ExtParam }) => ({
  stackName: `stack-${Env}`,
  ExtParam
})
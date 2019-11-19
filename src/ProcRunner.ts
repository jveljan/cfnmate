import { spawn } from 'child_process'

export default class ProcRunner {
  private cmd: string
  private dryRun?: boolean
  private debug?: boolean

  private args: string[] = []

  constructor(cmd: string, dryRun?: boolean, debug?: boolean) {
    this.cmd = cmd
    this.dryRun = dryRun;
    this.debug = debug;
  }

  printCmdLine(prefix?: string) {
    console.log(prefix ? prefix : '', this.cmd, this.args.join(' '))
  }

  run() {
    // TODO: improve output and debugging...
    if (this.dryRun) {
      this.printCmdLine("DRY_RUN_MODE:")
      return 0
    }
    if (this.debug) {
      this.printCmdLine('+:')
    }
    const sproc = spawn(this.cmd, this.args)
    sproc.stdout.on('data', data => process.stdout.write(data))
    sproc.stderr.on('data', data => process.stderr.write(data))
    return new Promise((resolve, reject) => {
      sproc.on('close', resolve)
      sproc.on('error', reject)
    })
  }

  addKeyValue(key: string, val?: Dictionary | string) {
    switch (typeof val) {
      case 'undefined':
        return
      case 'string':
        this.args.push(key)
        this.args.push(val)
        return
      case 'object':
        const dic = val;
        const pairs = Object.keys(dic).map(k => `${k}=${dic[k]}`)
        if (pairs.length > 0) {
          this.args.push(key)
          this.args.push(...pairs)
        }
        return
    }
    throw `Unknown type for ${val} at addArg'`
  }

  addArg(arg: string) {
    this.args.push(arg)
  }

  addAll(arr?: string[]) {
    if (arr && arr.length > 0) {
      this.args.push(...arr)
    }
  }

}
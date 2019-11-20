'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var tmpPromise = require('tmp-promise');
var path = _interopDefault(require('path'));
var yamlCfn = require('yaml-cfn');
var child_process = require('child_process');
var archiver = _interopDefault(require('archiver'));
var stream = _interopDefault(require('stream'));
var util = _interopDefault(require('util'));
var awsSdk = require('aws-sdk');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

const resolvePath = (file) => path.isAbsolute(file) ? file : path.join(process.cwd(), file);
const extractIfFn = (maybeFn, ...args) => typeof maybeFn == 'function' ? maybeFn(...args) : maybeFn;
const resolvePathRelativeTo = (file, name) => path.join(path.dirname(resolvePath(file)), name);
/**
 * Resolved configuration merged with params
 */
function loadConfig(absConfigPath, params, overrides = {}) {
    const mdl = require(absConfigPath);
    const moduleExtractedConfig = extractIfFn(mdl, params);
    const config = Object.assign({
        debug: false,
        dryRun: false
    }, moduleExtractedConfig, overrides);
    return config;
}
/**
 * Returns valid yaml context document
 */
function loadTemplate(templateAbsPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield fs.promises.readFile(templateAbsPath, 'utf-8');
        return yamlCfn.yamlParse(data);
    });
}

var loader = /*#__PURE__*/Object.freeze({
    __proto__: null,
    resolvePath: resolvePath,
    extractIfFn: extractIfFn,
    resolvePathRelativeTo: resolvePathRelativeTo,
    loadConfig: loadConfig,
    loadTemplate: loadTemplate
});

class CfnTemplate {
    constructor(document) {
        this.document = document;
    }
    get AWSTemplateFormatVersion() {
        return this.document.AWSTemplateFormatVersion;
    }
    get Description() {
        return this.document.Description;
    }
    get Metadata() {
        return this.document.Metadata;
    }
    get Parameters() {
        return this.document.Parameters || {};
    }
    get Mappings() {
        return this.document.Mappings;
    }
    get Transform() {
        return this.document.Transform;
    }
    get Conditions() {
        return this.document.Conditions;
    }
    get Resources() {
        return this.document.Resources;
    }
    get Outputs() {
        return this.document.Outputs;
    }
    validateWithParams(params) {
        const isNullOrUndefined = (v) => (v === null || v === undefined);
        const missing = Object.keys(this.Parameters)
            .filter(k => isNullOrUndefined(this.Parameters[k].Default)
            &&
                isNullOrUndefined(params[k]));
        if (missing.length > 0) {
            throw `Missing required parameters: "${missing}"`;
        }
    }
}

class ProcRunner {
    constructor(cmd, dryRun, debug) {
        this.args = [];
        this.cmd = cmd;
        this.dryRun = dryRun;
        this.debug = debug;
    }
    printCmdLine(prefix) {
        console.log(prefix ? prefix : '', this.cmd, this.args.join(' '));
    }
    run() {
        // TODO: improve output and debugging...
        if (this.dryRun) {
            this.printCmdLine("DRY_RUN_MODE:");
            return 0;
        }
        if (this.debug) {
            this.printCmdLine('+:');
        }
        const sproc = child_process.spawn(this.cmd, this.args);
        sproc.stdout.on('data', data => process.stdout.write(data));
        sproc.stderr.on('data', data => process.stderr.write(data));
        return new Promise((resolve, reject) => {
            sproc.on('close', resolve);
            sproc.on('error', reject);
        });
    }
    addKeyValue(key, val) {
        switch (typeof val) {
            case 'undefined':
                return;
            case 'string':
                this.args.push(key);
                this.args.push(val);
                return;
            case 'object':
                const dic = val;
                const pairs = Object.keys(dic).map(k => `${k}=${dic[k]}`);
                if (pairs.length > 0) {
                    this.args.push(key);
                    this.args.push(...pairs);
                }
                return;
        }
        throw `Unknown type for ${val} at addArg'`;
    }
    addArg(arg) {
        this.args.push(arg);
    }
    addAll(arr) {
        if (arr && arr.length > 0) {
            this.args.push(...arr);
        }
    }
}

/**
 * Loads config with merged params from input and document default params
 */
function cmdDeploy(template, inputParams, args, cfmateConfigFile, configOverrides) {
    return __awaiter(this, void 0, void 0, function* () {
        const templateAbsPath = resolvePath(template);
        const tpl = yield loadTemplate(templateAbsPath);
        const doc = new CfnTemplate(tpl);
        const configAbsPath = resolvePathRelativeTo(templateAbsPath, cfmateConfigFile || 'cfnmate.config.js');
        const cfg = loadConfig(configAbsPath, mergedParams(doc, inputParams), configOverrides);
        return deploy(doc, cfg, inputParams);
    });
}
function deploy(doc, cfg, inputParams, args) {
    return __awaiter(this, void 0, void 0, function* () {
        const parameterOverrides = Object.assign({}, inputParams, cfg.params);
        doc.validateWithParams(parameterOverrides);
        const pluginsRun = pluginsRunner(cfg.plugins || []);
        // plugins
        yield pluginsRun('applyTransform', doc.document);
        const tplData = yamlCfn.yamlDump(doc.document);
        yield pluginsRun('beforeDeploy', tplData, cfg, parameterOverrides, args);
        const result = yield runCfnDeploy(tplData, cfg, parameterOverrides, args);
        yield pluginsRun('afterDeploy', result, tplData);
        return result;
    });
}
function mergedParams(doc, inputParams) {
    const arg = {};
    Object.keys(doc.Parameters).forEach(k => {
        const defaultValue = doc.Parameters[k].Default;
        if (defaultValue != null || defaultValue != undefined) {
            arg[k] = doc.Parameters[k].Default;
        }
    });
    Object.keys(inputParams).forEach(k => {
        arg[k] = inputParams[k];
    });
    return arg;
}
function pluginsRunner(plugins) {
    return (fn, ...args) => __awaiter(this, void 0, void 0, function* () {
        const results = [];
        for (let i = 0; i < plugins.length; i++) {
            if (typeof plugins[i][fn] == 'function') {
                const result = yield plugins[i][fn](...args);
                results.push(result);
            }
            else {
                results.push({
                    error: `Unable to run ${fn} in plugin ${plugins[i].name || 'plugin-index-' + i}`,
                    plugin: plugins[i]
                });
            }
        }
        return results;
    });
}
function runCfnDeploy(tplData, cfg, parameterOverrides, additionalParams) {
    return __awaiter(this, void 0, void 0, function* () {
        const { path, cleanup } = yield tmpPromise.file();
        try {
            yield fs.promises.writeFile(path, tplData);
            const aws = new ProcRunner('aws', cfg.dryRun, cfg.debug);
            aws.addArg('cloudformation');
            aws.addArg('deploy');
            aws.addKeyValue('--stack-name', cfg.stackName);
            aws.addKeyValue('--template-file', path);
            aws.addKeyValue('--parameter-overrides', parameterOverrides);
            aws.addKeyValue('--capabilities', cfg.capabilities);
            aws.addKeyValue('--tags', cfg.tags);
            aws.addAll(additionalParams);
            return yield aws.run();
        }
        finally {
            cleanup();
        }
    });
}

var cfnmate = /*#__PURE__*/Object.freeze({
    __proto__: null,
    cmdDeploy: cmdDeploy,
    deploy: deploy,
    mergedParams: mergedParams,
    pluginsRunner: pluginsRunner,
    runCfnDeploy: runCfnDeploy
});

function checkFileAccess(path) {
    return util.promisify(fs.access)(path, fs.constants.F_OK);
}
function zipDirToBuffer(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        yield checkFileAccess(dirPath);
        return new Promise(resolve => {
            const chunks = [];
            const output = new stream.Writable({
                write(chunk, encoding, next) {
                    chunks.push(chunk);
                    next();
                }
            });
            output.on('finish', () => {
                resolve(Buffer.concat(chunks));
            });
            const archive = archiver('zip');
            archive.pipe(output);
            archive.directory(dirPath, false);
            archive.finalize();
        });
    });
}
const s3 = new awsSdk.S3();
function zipAndPushToS3(localDir, bucket, key) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Zipping dir', localDir);
        const buffer = yield zipDirToBuffer(localDir);
        console.log('Uploading to S3 bucket', bucket, 'key', key);
        const req = {
            Body: buffer,
            Bucket: bucket,
            Key: key
        };
        return yield s3.putObject(req).promise();
    });
}

var s3util = /*#__PURE__*/Object.freeze({
    __proto__: null,
    zipDirToBuffer: zipDirToBuffer,
    zipAndPushToS3: zipAndPushToS3
});

var main = {
    cfnmate,
    loader,
    s3util
};

module.exports = main;

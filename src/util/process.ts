import {
	exec as execChild,
	spawn as spawnChild,
	ChildProcess,
	ExecOptions as ChildExecOptions,
	SpawnOptions as ChildSpawnOptions
} from 'child_process';
import { logger, LogStream } from '../log';

export function promisify(proc: ChildProcess): Promise<ChildProcess> {
	return new Promise(function (resolve, reject) {
		proc.on('close', function (code) {
			if (code === 0) {
				resolve(proc);
			}
			else {
				process.exitCode = code;
				reject(new Error(`Process exited with a code of ${ code }`));
			}
		});
	});
}

export interface CommonProcessOptions {
	display?: boolean;
	silent?: boolean;
}

export interface ExecOptions extends CommonProcessOptions, ChildExecOptions {
}

function applyOptions(proc: ChildProcess, options: CommonProcessOptions) {
	if (options.silent === false || options.display === true) {
		proc.stdout.pipe(new LogStream());
		proc.stderr.pipe(new LogStream('error'));
	}
}

export function exec(command: string, options?: ExecOptions): ChildProcess {
	logger.debug(`exec ${ command }`);
	const proc: ChildProcess = execChild(command, options);
	applyOptions(proc, options);
	return proc;
}

export function promiseExec(command: string, options: ExecOptions = {}) {
	// We don't have access to stdout and stderr buffers so we want then to output to console by default
	options.silent = options.silent || false;
	return promisify(exec(command, options));
}

export interface SpawnOptions extends CommonProcessOptions, ChildSpawnOptions {
}

export function spawn(command: string, args: string[], options?: SpawnOptions): ChildProcess {
	logger.debug(`spawn ${ command } ${ args ? args.join(' ') : '' }`);
	const proc: ChildProcess = spawnChild(command, args, options);
	applyOptions(proc, options);
	return proc;
}

export function promiseSpawn(command: string, args: string[], options: SpawnOptions = {}) {
	// We don't have access to stdout and stderr buffers so we want then to output to console by default
	options.silent = options.silent || false;
	return promisify(spawn(command, args, options));
}

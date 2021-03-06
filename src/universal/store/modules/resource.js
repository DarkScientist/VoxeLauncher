import crypto from 'crypto';
import { promises as fs, createReadStream, existsSync } from 'fs';
import paths from 'path';
import url from 'url';
import { ResourcePack, Forge, LiteLoader } from 'ts-minecraft';
import { net } from 'electron';
import { requireString, requireObject } from '../helpers/utils';
import base from './resource.base';
import { ensureDir, ensureFile, copy } from '../helpers/fs-utils';

/**
 * 
 * @param {string} folder 
 * @param {crypto.Hash} hasher 
 */
async function hashFolder(folder, hasher) {
    const files = await fs.readdir(folder);
    for (const f of files) {
        const st = await fs.stat(f); // eslint-disable-line
        if (st.isDirectory()) {
            hashFolder(`${folder}/${f}`, hasher);
        } else {
            hasher.update(await fs.readFile()) // eslint-disable-line
        }
    }
    return hasher;
}

async function readHash(file) {
    return new Promise((resolve, reject) => {
        createReadStream(file)
            .pipe(crypto.createHash('sha1').setEncoding('hex'))
            .once('finish', function () { resolve(this.read()); });
    });
}

function getRegularName(type, meta) {
    let fmeta;
    switch (type) {
        case 'forge':
            fmeta = meta[0];
            if (typeof (fmeta.name || fmeta.modid) !== 'string'
                || typeof fmeta.mcversion !== 'string'
                || typeof fmeta.version !== 'string') return undefined;
            return `${fmeta.name || fmeta.modid}-${fmeta.mcversion}-${fmeta.version}`;
        case 'liteloader':
            if (typeof meta.name !== 'string'
                || typeof meta.mcversion !== 'string'
                || typeof meta.revision !== 'number') return undefined;
            return `${meta.name}-${meta.mcversion}-${meta.revision}`;
        case 'resourcepack':
            return meta.packName;
        default:
            return 'Unknown';
    }
}

/**
 * @return {Promise<import('./resource').Resource<any>>}
 */
async function parseResource(filename, hash, ext, data, source) {
    const { meta, domain, type, error } = await Forge.meta(data).then(meta => ({ domain: 'mods', meta, type: 'forge' }),
        _ => LiteLoader.meta(data).then(meta => ({ domain: 'mods', meta, type: 'liteloader' }),
            _ => ResourcePack.read(filename, data).then(meta => ({ domain: 'resourcepacks', meta, type: 'resourcepack' }),
                e => ({ domain: undefined, meta: undefined, type: undefined, error: e }))));

    if (!domain || !meta) throw new Error(`Cannot parse ${filename}.`);

    Object.freeze(source);
    Object.freeze(meta);

    return {
        name: getRegularName(type, meta) || filename,
        hash,
        ext,
        metadata: meta,
        domain,
        type,
        source,
    };
}


/**
 * @type {import('./resource').ResourceModule}
 */
const mod = {
    ...base,
    actions: {
        load(context) {
            return context.dispatch('refresh');
        },

        async refresh(context) {
            const modsDir = context.rootGetters.path('mods');
            const resourcepacksDir = context.rootGetters.path('resourcepacks');
            await ensureDir(modsDir);
            await ensureDir(resourcepacksDir);
            const modsFiles = await fs.readdir(modsDir);
            const resourcePacksFiles = await fs.readdir(resourcepacksDir);


            async function reimport(file) {
                try {
                    const hash = await readHash(file);
                    const metaFile = context.rootGetters.path('resources', `${hash}.json`);

                    const metadata = await context.dispatch('getPersistence', metaFile, { root: true });
                    if (!metadata) {
                        const ext = paths.extname(file);
                        const name = paths.basename(file, ext);

                        const resource = await parseResource(file, hash, ext, await fs.readFile(file), {
                            name,
                            path: paths.resolve(file),
                            date: Date.now(),
                        });
                        resource.path = file;

                        await context.dispatch('setPersistence', { path: paths.join('resources', `${hash}.json`), data: resource }, { root: true });

                        return resource;
                    }
                } catch (e) {
                    console.error(`Cannot resolve resource file ${file}.`);
                    console.error(e);
                }
                return undefined;
            }
            const resources = (await Promise.all(modsFiles.map(file => context.rootGetters.path('mods', file)).concat(resourcePacksFiles.map(file => context.rootGetters.path('resourcepacks', file))).map(reimport)))
                .filter(resource => resource !== undefined);
            if (resources.length > 0) {
                context.commit('resources', resources);
            }
        },

        save(context, { mutation, object }) { },

        remove(context, resource) {
            if (typeof resource === 'string') resource = context.getters.getResource(resource);
            if (!resource) return Promise.resolve();
            context.commit('remove', resource);
            return Promise.all([
                context.dispatch('delete', `resources/${resource.hash}.json`, { root: true }),
                context.dispatch('delete', `resources/${resource.hash}${resource.type}`, { root: true }),
            ]);
        },
        rename(context, payload) {
            requireObject(payload);
            requireString(payload.name);

            const resource = typeof payload.resource === 'string' ? context.getters.getResource(resource) : payload.resource;
            if (!resource) throw new Error('Cannot find resource');
            context.commit('rename', { domain: resource.domain, hash: resource.hash, name: payload.name });
            return context.dispatch('setPersistence', { path: `resources/${payload.resource.hash}.json`, data: payload.resource }, { root: true });
        },

        importAll(context, all) {
            if (all instanceof Array) {
                return Promise.all(all.map(r => context.dispatch('import', r)));
            }
            return Promise.reject(new Error('Require argument be an array!'));
        },

        async import(context, { path, metadata = {} }) {
            requireString(path);

            const importTaskContext = await context.dispatch('task/createShallow', { name: 'resource.import' }, { root: true });
            const root = context.rootState.root;

            let data;
            let ext;
            let hash;
            let name;
            let isDir = false;

            const theURL = url.parse(path);
            if (theURL.protocol === 'https:' || theURL.protocol === 'http:') {
                data = await new Promise((resolve, reject) => {
                    const req = net.request({ url: path, redirect: 'manual' });
                    const bufs = [];
                    req.on('response', (resp) => {
                        resp.on('error', reject);
                        resp.on('data', (chunk) => { bufs.push(chunk); });
                        resp.on('end', () => { resolve(Buffer.concat(bufs)); });
                    });
                    req.on('redirect', (code, method, redirectUrl, header) => {
                        name = paths.basename(redirectUrl, '.zip');
                        ext = paths.extname(redirectUrl);
                        req.followRedirect();
                    });

                    req.on('error', reject);
                    req.end();
                });

                hash = crypto.createHash('sha1').update(data).digest('hex').toString('utf-8');
            } else {
                name = paths.basename(paths.basename(path, '.zip'), '.jar');
                const status = await fs.stat(path);

                if (status.isDirectory()) {
                    isDir = true;
                    ext = '';
                    hash = (await hashFolder(path, crypto.createHash('sha1'))).digest('hex').toString('utf-8');
                } else {
                    data = await fs.readFile(path);
                    ext = paths.extname(path);
                    hash = crypto.createHash('sha1').update(data).digest('hex').toString('utf-8');
                }
            }

            const source = {
                name,
                path: paths.resolve(path),
                date: Date.now(),
                ...metadata,
            };

            importTaskContext.update(1, 4, 'resource.import.checkingfile');

            // take hash of dir or file
            await ensureDir(paths.join(root, 'resources'));
            const metaFile = paths.join(root, 'resources', `${hash}.json`);

            // if exist, abort
            if (existsSync(metaFile)) {
                importTaskContext.finish('resource.import.existed');
                return undefined;
            }

            // use parser to parse metadata
            importTaskContext.update(2, 4, 'resource.import.parsing');

            const resource = await parseResource(path, hash, ext, data, source);

            console.log(`Import resource ${name}${ext}(${hash}) into ${resource.domain}`);

            let dataFile = paths.join(root, resource.domain, `${resource.name}${ext}`);

            if (existsSync(dataFile)) {
                dataFile = paths.join(root, resource.domain, `${resource.name}.${hash}${ext}`);
            }

            resource.path = dataFile;

            importTaskContext.update(3, 4, 'resource.import.storing');
            // write resource to disk
            if (isDir) {
                await ensureDir(dataFile);
                await copy(path, dataFile);
            } else {
                await ensureFile(dataFile);
                await fs.writeFile(dataFile, data);
            }

            importTaskContext.update(4, 4, 'resource.import.update');
            // store metadata to disk
            await fs.writeFile(paths.join(root, 'resources', `${hash}.json`), JSON.stringify(resource, undefined, 4));
            importTaskContext.finish();

            context.commit('resource', resource);

            return resource;
        },

        async deploy(context, payload) {
            if (!payload) throw new Error('Require input a resource with minecraft location');

            const { resources, minecraft } = payload;
            if (!resources) throw new Error('Resources cannot be undefined!');
            if (!minecraft) throw new Error('Minecract location cannot be undefined!');

            const promises = [];
            for (const resource of resources) {
                /**
                * @type {Resource}
                */
                let res;
                if (typeof resource === 'string') res = context.getters.getResource(resource);
                else res = resource;

                if (!res) throw new Error(`Cannot find the resource ${resource}`);
                if (typeof res !== 'object' || !res.hash || !res.type || !res.domain || !res.name) {
                    throw new Error('The input resource object should be valid!');
                }
                const dest = paths.join(minecraft, res.domain, res.name + res.ext);
                if (existsSync(dest)) {
                    await fs.unlink(dest);
                }
                promises.push(fs.link(res.path, dest));
            }
            await Promise.all(promises);
        },

        async exports(context, payload) {
            const { resources, targetDirectory } = payload;

            const promises = [];
            for (const resource of resources) {
                /**
                * @type {Resource}
                */
                let res;
                if (typeof resource === 'string') res = context.getters.getResource(resource);
                else res = resource;

                if (!res) throw new Error(`Cannot find the resource ${resource}`);

                promises.push(copy(res.path, paths.join(targetDirectory, res.name + res.ext)));
            }
            await Promise.all(promises);
        },

    },
};

export default mod;

import {
    Forge, LiteLoader, Version, ForgeWebPage,
} from 'ts-minecraft';
import { promises as fs, createReadStream } from 'fs';

import { createHash } from 'crypto';
import base from './version.base';

/**
 * @type {import('./version').VersionModule}
 */
const mod = {
    namespaced: true,
    state: base.state,
    getters: base.getters,
    mutations: base.mutations,
    actions: {
        load(context) {
            return context.dispatch('refresh');
        },
        async refresh(context) {
            /**
             * Read local folder
             */
            const files = await context.dispatch('readFolder', 'versions', { root: true });

            if (files.length === 0) return;

            const versions = [];
            for (const versionId of files.filter(f => !f.startsWith('.'))) {
                try {
                    const resolved = await Version.parse(context.rootState.root, versionId);
                    const minecraft = resolved.client;
                    let forge = resolved.libraries.filter(l => l.name.startsWith('net.minecraftforge:forge'))[0];
                    if (forge) {
                        forge = forge.name.split(':')[2].split('-')[1];
                    }
                    let liteloader = resolved.libraries.filter(l => l.name.startsWith('com.mumfrey:liteloader'))[0];
                    if (liteloader) {
                        liteloader = liteloader.name.split(':')[2];
                    }
                    versions.push({
                        forge,
                        liteloader,
                        id: resolved.id,
                        jar: resolved.jar,
                        minecraft,
                    });
                } catch (e) {
                    console.error('An error occured during refresh local versions');
                    console.error(e);
                }
            }
            context.commit('local', versions);
        },

        /**
         * @param {string} version 
         */
        async checkDependencies(context, version) {
            const location = context.rootState.root;
            const resolved = await Version.parse(location, version);
            const task = Version.checkDependenciesTask(resolved, location);
            const handle = await context.dispatch('task/execute', task, { root: true });
            return handle;
        },
    },
    modules: {
        minecraft: {
            ...base.modules.minecraft,
            actions: {
                async load(context) {
                    const data = await context.dispatch('getPersistence', { path: 'version.json' }, { root: true });
                    if (data) context.commit('update', data);
                    await context.dispatch('save');
                    context.dispatch('refresh');
                },
                save(context) {
                    return context.dispatch('setPersistence',
                        { path: 'version.json', data: { latest: context.state.latest, versions: context.state.versions, timestamp: context.state.timestamp } },
                        { root: true });
                },
                /**
                * Refresh the remote versions cache 
                */
                async refresh(context) {
                    const timed = { timestamp: context.state.timestamp };
                    const metas = await Version.updateVersionMeta({ fallback: timed });
                    if (timed !== metas) {
                        context.commit('update', metas);
                    }
                    const files = await context.dispatch('readFolder', 'versions', { root: true });

                    if (files.length === 0) return;

                    function checksum(path) {
                        const hash = createHash('sha1');
                        return new Promise((resolve, reject) => createReadStream(path)
                            .pipe(hash)
                            .on('error', (e) => { reject(new Error(e)); })
                            .once('finish', () => { resolve(hash.digest('hex')); }));
                    }
                    for (const versionId of files.filter(f => !f.startsWith('.'))) {
                        try {
                            const jsonPath = context.rootGetters.path('versions', versionId, `${versionId}.json`);
                            const json = await fs.readFile(jsonPath, { flag: 'r', encoding: 'utf-8' })
                                .then(b => b.toString()).then(JSON.parse);
                            if (json.inheritsFrom === undefined && json.assetIndex) {
                                const id = json.id;
                                const meta = context.state.versions[id];
                                const tokens = meta.url.split('/');
                                const sha1 = tokens[tokens.length - 2];
                                if (sha1 !== await checksum(jsonPath)) {
                                    const taskId = await context.dispatch('download', meta);
                                    await context.dispatch('task/wait', taskId, { root: true });
                                }
                            }
                        } catch (e) {
                            console.error(`An error occured during check minecraft version ${versionId}`);
                            console.error(e);
                        }
                    }
                },

                /**
                 * Download and install a minecract version
                 */
                async download(context, meta) {
                    const id = meta.id;

                    context.commit('addPending', id);

                    const task = Version.downloadVersionTask('client', meta, context.rootState.root);
                    const taskId = await context.dispatch('task/execute', task, { root: true });

                    context.dispatch('task/wait', taskId, { root: true })
                        .then(() => context.dispatch('version/refresh', undefined, { root: true }))
                        .catch((e) => {
                            console.warn(`An error ocurred during download version ${id}`);
                            console.warn(e);
                        }).finally(() => {
                            context.commit('removePending', id);
                        });

                    return taskId;
                },

                // init(context) {
                //     const localVersions = {};
                //     context.rootState.version.local.forEach((ver) => {
                //         if (ver.minecraft) localVersions[ver.minecraft] = true;
                //     });
                //     const statusMap = {};
                //     for (const ver of Object.keys(context.state.versions)) {
                //         statusMap[ver] = localVersions[ver] ? 'local' : 'remote';
                //     }

                //     context.commit('statusAll', statusMap);
                // },
            },
        },
        forge: {
            ...base.modules.forge,

            actions: {
                async load(context) {
                    const struct = await context.dispatch('getPersistence', { path: 'forge-versions.json' }, { root: true });
                    if (struct) {
                        context.commit('load', struct);
                    }
                    context.dispatch('refresh').then(() => context.dispatch('save'), () => context.dispatch('save'));
                },
                save(context) {
                    return context.dispatch('setPersistence', { path: 'forge-versions.json', data: { mcversions: context.state.mcversions } }, { root: true });
                },
                // init(context) {
                //     const localForgeVersion = {};
                //     context.rootState.version.local.forEach((ver) => {
                //         if (ver.forge) localForgeVersion[ver.forge] = true;
                //     });
                //     const statusMap = {};

                //     Object.keys(context.state.mcversions).forEach((mcversion) => {
                //         const container = context.state.mcversions[mcversion];
                //         if (container.versions) {
                //             container.versions.forEach((version) => {
                //                 statusMap[version.version] = localForgeVersion[version.version] ? 'local' : 'remote';
                //             });
                //         }
                //     });
                //     context.commit('statusAll', statusMap);
                // },
                /**
                 * download a specific version from version metadata
                 */
                async download(context, meta) {
                    const task = Forge.installAndCheckTask(meta, context.rootGetters.root, true);
                    // context.commit('status', { version: meta.version, status: 'loading' });
                    const id = context.dispatch('task/execute', task, { root: true });
                    context.dispatch('task/wait', id, { root: true })
                        .then(() => context.dispatch('version/refresh', undefined, { root: true }))
                        .catch((e) => {
                            console.warn(`An error ocurred during download version ${id}`);
                            console.warn(e);
                        });
                    return id;
                },

                /**
                * Refresh the remote versions cache 
                */
                async refresh(context) {
                    const prof = context.rootState.profile.all[context.rootState.profile.id];
                    const mcversion = prof.mcversion;
                    const fallback = { timestamp: context.state.mcversions[mcversion].timestamp };
                    const result = await ForgeWebPage.getWebPage({ mcversion, fallback });
                    if (result === fallback) return;
                    context.commit('update', result);
                },
            },
        },
        // liteloader: {
        //     ...base.modules.liteloader,

        //     actions: {
        //         async load(context) {
        //             const struct = await context.dispatch('getPersistence', { path: 'lite-versions.json' }, { root: true });
        //             if (struct) context.commit('update', struct);
        //             context.dispatch('refresh').then(() => context.dispatch('save'), () => context.dispatch('save'));
        //         },
        //         save(context) {
        //             return context.dispatch('setPersistence', { path: 'lite-versions.json', data: context.state }, { root: true });
        //         },
        //         // init(context) {
        //         //     // refresh local version existances/status map
        //         //     const localVers = {};
        //         //     const localArr = context.rootState.version.local;
        //         //     localArr.forEach((ver) => {
        //         //         if (ver.liteloader) localVers[ver.liteloader] = true;
        //         //     });
        //         //     const statusMap = {};
        //         //     Object.keys(context.state.versions).forEach((versionId) => {
        //         //         const verObj = context.state.versions[versionId];
        //         //         if (verObj.snapshot) {
        //         //             statusMap[verObj.snapshot.version] = localVers[verObj.snapshot.version] ? 'local' : 'remote';
        //         //         }
        //         //         if (verObj.release) {
        //         //             statusMap[verObj.release.version] = localVers[verObj.release.version] ? 'local' : 'remote';
        //         //         }
        //         //     });
        //         //     context.commit('statusAll', statusMap);
        //         // },
        //         /**
        //          * @param {ActionContext<VersionsState.Inner>} context 
        //          */
        //         async download(context, meta) {
        //             const task = LiteLoader
        //                 .installAndCheckTask(meta, context.rootGetters.root, true);
        //             context.commit('status', { version: meta.version, status: 'loading' });
        //             return context.dispatch('task/execute', task, { root: true })
        //                 .then(() => {
        //                     context.commit('status', { version: meta.version, status: 'local' });
        //                 }, () => {
        //                     context.commit('status', { version: meta.version, status: 'remote' });
        //                 });
        //         },
        //         $refresh: {
        //             root: true,
        //             /**
        //              * @param {ActionContext<VersionsState.Inner>} context 
        //              */
        //             handler(context) {
        //                 // return $refresh(context)
        //             },
        //         },
        //         /**
        //          * @param {ActionContext<VersionsState.Inner>} context 
        //          */
        //         async refresh(context) {
        //             const option = context.state.date === '' ? undefined : {
        //                 fallback: { date: context.state.date || '', list: context.state.list || [] },
        //             };
        //             const remoteList = await LiteLoader.VersionMetaList.update(option);
        //             context.commit('update', remoteList);
        //         },
        //     },
        // },
    },
};

export default mod;

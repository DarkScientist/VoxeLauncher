import { VersionMeta, MinecraftFolder, Version, LiteLoader, Forge, VersionMetaList } from 'ts-minecraft'

async function $refresh(context) {
    const option = context.state.date === '' ? undefined : {
        fallback: { date: context.state.date || '', list: context.state.list || [] },
    };
    const remoteList = await LiteLoader.VersionMetaList.update();
    context.commit('update', remoteList);
}

export default {
    namespaced: true,
    state: () => ({
        updateTime: '',
        versions: [],
        latest: {
            snapshot: '',
            release: '',
        },
        local: [],
    }),
    getters: {
        versions: state => state.versions || [],
        versionsMap: state => state.versions.reduce((o, v) => { o[v.id] = v; return o; }, {}) || {},
        latestRelease: state => state.latest.release || '',
        latestSnapshot: state => state.latest.snapshot || '',
        local: state => state.local,
    },
    mutations: {
        update(state, list) {
            state.updateTime = list.date;
            if (list.list) {
                state.versions = list.list.versions;
                state.latest.release = list.list.latest.release;
                state.latest.snapshot = list.list.latest.snapshot;
            }
        },
        status(state, { version, status }) {
            version.status = status
        },
        local(state, local) {
            state.local = local;
        },
    },
    actions: {
        async load(context, payload) {
            /**
             * @type {VersionMetaList}
             */
            const data = await context.dispatch('read', { path: 'version.json', fallback: {}, type: 'json' }, { root: true })
            const container = {
                date: data.updateTime,
                list: data,
            }
            context.commit('update', container);
            await context.dispatch('refresh');
        },
        save(context, payload) {
            return context.dispatch('write', {
                path: 'version.json',
                data: JSON.stringify(context.state,
                    (key, val) => {
                        if (key === 'forge' || key === 'liteloader' || key === 'local') return undefined;
                        return val;
                    }),
            }, { root: true })
        },
        /**
         * 
         * @param {ActionContext} context 
         * @param {VersionMeta|string} meta
         */
        async download(context, meta) {
            if (typeof meta === 'string') {
                if (!context.getters.versionsMap[meta]) throw new Error(`Cannot find the version meta for [${meta}]. Please Refresh the meta cache!`)
                meta = context.getters.versionsMap[meta];
            }

            const id = meta.id;
            context.commit('status', { version: meta, status: 'loading' })
            let exist = await context.dispatch('exist', [`versions/${id}`, `versions/${id}/${id}.jar`, `versions/${id}/${id}.json`], { root: true });
            if (!exist) {
                try {
                    let location = context.rootGetters.root;
                    if (typeof location === 'string') location = new MinecraftFolder(location);
                    if (!(location instanceof MinecraftFolder)) return Promise.reject('Require location as string or MinecraftLocation!');
                    const task = Version.installTask('client', meta, location)
                    await context.dispatch('task/listen', task, { root: true });
                    await task.execute();
                } catch (e) { console.warn(e) }
            }
            exist = await context.dispatch('exist', [`versions/${id}`, `versions/${id}/${id}.jar`, `versions/${id}/${id}.json`], { root: true });
            if (exist) {
                context.commit('status', { version: meta, status: 'local' })
            } else {
                context.commit('status', { version: meta, status: 'remote' })
            }
            return undefined;
        },
        checkClient(context, { version, location }) {
            if (typeof location === 'string') location = new MinecraftFolder(location)
            if (!(location instanceof MinecraftFolder)) return Promise.reject('Require location as string or MinecraftLocation!')
            return Version.checkDependency(version, location)
        },
        /**
         * 
         * @param {ActionContext} context 
         * @param {{version: string, forge: string, liteloader: string}} option 
         */
        prepare(context, option) {

        },
        /**
         * Refresh the remote versions cache 
         */
        async refresh(context) {
            const container = {
                date: context.state.updateTime,
                list: context.state,
            }
            /**
             * Update from internet
             */
            let metas = container;
            try {
                metas = await Version.updateVersionMeta({ fallback: container })
            } catch (e) {
                console.error(e)
            }
            /**
             * Read local folder
             */
            const files = await context.dispatch('readFolder', { path: 'versions' }, { root: true })

            const versionArr = [];
            const idArr = [];
            for (const ver of files) {
                try {
                    const resolved = await Version.parse(context.rootGetters.root, ver);
                    const minecraft = resolved.client;
                    let forge = resolved.libraries.filter(l => l.name.startsWith('net.minecraftforge:forge'))[0];
                    if (forge) {
                        forge = forge.name.split(':')[2].split('-')[1];
                    }
                    let liteloader = resolved.libraries.filter(l => l.name.startsWith('com.mumfrey:liteloader'))[0];
                    if (liteloader) {
                        liteloader = liteloader.name.split(':')[2];
                    }
                    idArr.push(resolved.id);
                    versionArr.push({
                        forge,
                        liteloader,
                        id: resolved.id,
                        jar: resolved.jar,
                        minecraft,
                    });
                } catch (e) {
                    console.error(e);
                }
            }
            context.commit('local', versionArr);

            /**
             * Update version status
             */
            metas.list.versions.forEach((ver) => {
                for (const verObj of versionArr) {
                    ver.status = 'remote';
                    if (verObj.minecraft === ver.id) {
                        ver.status = 'local';
                        break;
                    }
                }
            });

            context.commit('update', metas);
        },
    },
    modules: {
        forge: {
            namespaced: true,
            state: () => ({
                date: '',
                list: {
                    mcversion: {},
                    promos: {},
                },
                status: {},
            }),
            getters: {
                versions: state => state.list.number || [],
                versionsByMc: state =>
                    version =>
                        (state.list.mcversion[version] || [])
                            .map((num) => {
                                const meta = { status: 'remote', ...state.list.number[num] };
                                if (state.list.promos[`${version}-recommended`] === num) {
                                    meta.type = 'recommended';
                                } else if (state.list.promos[`${version}-latest`] === num) {
                                    meta.type = 'latest';
                                } else {
                                    meta.type = 'snapshot';
                                }
                                return meta;
                            }),
                latestByMc: state =>
                    version => state.list.number[state.list.promos[`${version}-latest`]],
                recommendedByMc: state =>
                    version => state.list.number[state.list.promos[`${version}-recommended`]],
            },
            mutations: {
                update(state, list) {
                    state.list = Object.freeze(list.list);
                    state.date = Object.freeze(list.date);
                },
                allStatus(state, allStatus) {
                    Object.keys(allStatus).forEach((key) => {
                        state.status[key] = allStatus[key];
                    })
                },
                status(state, { version, status }) {
                    state.status[version] = status;
                },
            },
            actions: {
                async load(context, payload) {
                    const struct = await context.dispatch('read', { path: 'forge-versions.json', fallback: {}, type: 'json' }, { root: true });
                    context.commit('update', struct);
                    return context.dispatch('refresh').then(() => context.dispatch('save'), () => context.dispatch('save'));
                },
                save(context, payload) {
                    const data = JSON.stringify(context.state);
                    return context.dispatch('write', { path: 'forge-versions.json', data }, { root: true })
                },
                init(context) {
                    const struct = Object.assign({}, context.state);
                    const localForgeVersion = {};
                    const localArr = context.rootGetters['versions/local'];
                    localArr.forEach((ver) => {
                        if (ver.forge) localForgeVersion[ver.forge] = true;
                    });
                    const statusMap = {};
                    Object.keys(struct.list.number).forEach((key) => {
                        const verObj = struct.list.number[key];
                        statusMap[verObj.version] = localForgeVersion[verObj.version] ? 'local' : 'remote'
                    })
                    context.commit('allStatus', statusMap);
                },
                /**
                 * 
                 * @param {ActionContext} context 
                 * @param {VersionMeta} meta
                 */
                async download(context, meta) {
                    const task = Forge.installAndCheckTask(meta, context.rootGetters.root, true);
                    context.commit('status', { key: meta.build, status: 'loading' });
                    task.name = `install.${meta.id}`;
                    context.dispatch('task/listen', task, { root: true });
                    return task.execute().then(() => {
                        console.log('install forge suc')
                        context.commit('status', { key: meta.build, status: 'local' })
                    }).catch((e) => {
                        console.log('install forge error')
                        console.log(e)
                        context.commit('status', { key: meta.build, status: 'remote' })
                    });
                },
                /**
                * Refresh the remote versions cache 
                */
                async refresh(context) {
                    const remoteList = await Forge.VersionMetaList.update({
                        fallback: { date: context.state.date || '', list: context.state.list },
                    });
                    context.commit('update', remoteList);
                },
            },
        },
        liteloader: {
            namespaced: true,
            state: () => ({
                list: {
                    versions: {},
                },
                date: '',
                status: {},
            }),
            getters: {
                versions: state => state.list.versions || [],
                versionsByMc: state =>
                    version => state.list.versions[version] || [],
                status: state => version => state.status[version],
            },
            mutations: {
                update(state, content) {
                    state.list = Object.freeze(content.list);
                    state.date = Object.freeze(content.date);
                },
                allStatus(state, status) {
                    for (const id of Object.keys(status)) {
                        state.status[id] = status[id];
                    }
                },
                status(state, { version, status }) {
                    state.status[version] = status;
                },
            },
            actions: {
                async load(context) {
                    const struct = await context.dispatch('read', { path: 'lite-versions.json', fallback: {}, type: 'json' }, { root: true });
                    context.commit('update', struct);
                    return context.dispatch('refresh').then(() => context.dispatch('save'), () => context.dispatch('save'));
                },
                init(context) {
                    const struct = Object.assign({}, context.state);
                    const localVers = {};
                    const localArr = context.rootGetters['versions/local'];
                    localArr.forEach((ver) => {
                        if (ver.liteloader) localVers[ver.liteloader] = true;
                    });
                    const statusMap = {};
                    Object.keys(struct.list.versions).forEach((versionId) => {
                        const verObj = struct.list.versions[versionId];
                        if (verObj.snapshot) {
                            statusMap[verObj.snapshot.version] = localVers[verObj.snapshot.version] ? 'local' : 'remote'
                        }
                        if (verObj.release) {
                            statusMap[verObj.release.version] = localVers[verObj.release.version] ? 'local' : 'remote'
                        }
                    })
                    context.commit('allStatus', statusMap);
                },
                save(context) {
                    const data = JSON.stringify(context.state);
                    return context.dispatch('write', { path: 'lite-versions.json', data }, { root: true })
                },
                async download(context, meta) {
                    const task = LiteLoader
                        .installAndCheckTask(meta, context.rootGetters.root, true);
                    context.commit('status', { version: meta.version, status: 'loading' });
                    await context.dispatch('task/listen', task, { root: true });
                    return task.execute().then(() => {
                        context.commit('status', { version: meta.version, status: 'local' });
                    }, () => {
                        context.commit('status', { version: meta.version, status: 'remote' });
                    });
                },
                $refresh: {
                    root: true,
                    handler(context) {
                        // return $refresh(context)
                    },
                },
                refresh(context) {
                    return $refresh(context)
                },
            },
        },
    },
}

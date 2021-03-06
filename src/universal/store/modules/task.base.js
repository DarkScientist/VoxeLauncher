import Vue from 'vue';

/**
 * @type {import('./task').TaskModule}
 */
const mod = {
    namespaced: true,
    state: {
        tree: {},
        tasks: [],

        maxLog: 20,
    },
    mutations: {
        create(state, { id, name }) {
            /**
            * @type {import('treelike-task').TaskNode}
            */
            const node = {
                name,
                total: -1,
                progress: -1,
                status: 'running',
                path: name,
                tasks: [],
                errors: [],
                message: '',
            };
            state.tree[id] = node;
            state.tasks.push(state.tree[id]);
        },
        update(state, {
            id, progress, total, message,
        }) {
            const task = state.tree[id];
            if (progress) task.progress = progress;
            if (total) task.total = total;
            if (message) task.message = message;
        },
        finish(state, { id, error }) {
            const task = state.tree[id];
            task.status = error ? 'failed' : 'successed';
        },
        prune(state) {
            function remove(task) {
                if (task.tasks && task.tasks.length !== 0) {
                    task.tasks.forEach(remove);
                }
                Vue.delete(state.tree, task._internalId);
            }
            if (state.tasks.length > state.maxLog) {
                for (const task of state.tasks.slice(state.maxLog, state.tasks.length - state.maxLog)) {
                    remove(task);
                }

                state.tasks = [...state.tasks.slice(0, state.maxLog)];
            }
        },
        hook(state, { id, task }) {
            const idToNode = state.tree;
            const local = { ...task, tasks: [], errors: [] };
            state.tasks.unshift(local);
            idToNode[id] = local;
        },
        $update(state, {
            adds, childs, updates, statuses,
        }) {
            const idToNode = state.tree;
            for (const add of adds) {
                const { id, node } = add;
                const local = { ...node, tasks: [], errors: [] };
                state.tasks.unshift(local);
                idToNode[id] = local;
            }
            for (const child of childs) {
                const { id, node } = child;
                const local = { ...node, tasks: [], errors: [] };
                idToNode[id].tasks.push(local);
                idToNode[node._internalId] = local;
            }
            for (const update of Object.keys(updates).map(k => ({ id: k, ...updates[k] }))) {
                const { id, progress, total, message, time } = update;
                const task = idToNode[id];
                if (progress) task.progress = progress;
                if (total) task.total = total;
                if (message) task.message = message;
                if (time) task.time = time || new Date().toLocaleTimeString();
            }
            for (const s of statuses) {
                const { id, status } = s;
                const task = idToNode[id];
                task.status = status;
            }
        },
    },
};

export default mod;

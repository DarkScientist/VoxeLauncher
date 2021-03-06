import { Store, Dispatch, DispatchOptions, MutationTree } from 'vuex'
import { GameProfile, MojangAccount, VersionMeta, Forge, LiteLoader, GameSetting } from 'ts-minecraft';
import { RendererInterface } from 'electron';

import { UserModule } from './modules/user'
import { VersionModule } from './modules/version'
import { ProfileModule, CreateOption } from './modules/profile';
import { JavaModule } from './modules/java';
import { ResourceModule, Resource } from './modules/resource'
import { TaskModule } from './modules/task';
import { ConfigModule } from './modules/config';


interface RootDispatch {
    /**
     * Exit the whole system
     */
    (type: "exit"): Promise<void>;
    /**
     * Launch the minecraft
     */
    (type: "launch", profileId: string, option?: { root: true }): Promise<void>;
    (type: 'openDialog', payload: any, option?: { root: true }): Promise<void>;
    (type: 'saveDialog', payload: any, option?: { root: true }): Promise<void>;

    (type: 'cache', url: string, option?: { root: true }): Promise<string>;
    (type: 'readFolder', path: string, option?: { root: true }): Promise<string[]>;
    (type: 'readFolder', path: string, option?: { root: true }): Promise<string[]>;

    (type: 'exists', path: string, option?: { root: true }): Promise<boolean>;
    (type: 'existsAll', paths: string[], option?: { root: true }): Promise<boolean>;
    (type: 'existsAny', paths: string[], option?: { root: true }): Promise<boolean>;

    (type: 'import', payload: { src: string, dest: string }, option?: { root: true }): Promise<void>;
    (type: 'export', payload: { src: string, dest: string }, option?: { root: true }): Promise<void>;

    (type: 'link', payload: { src: string, dest: string }, option?: { root: true }): Promise<void>;

    (type: 'setPersistence', payload: { path: string, data: any }, option?: { root: true }): Promise<void>;
    (type: 'getPersistence', payload: { path: string }, option?: { root: true }): Promise<object?>;

    (type: 'setPersistence', payload: { path: string, data: any }, option?: { root: true }): Promise<void>;
    (type: 'getPersistence', payload: { path: string }, option?: { root: true }): Promise<object?>;


    (type: 'user/selectLoginMode', mode: string, option?: { root: true }): Promise<void>;

    (
        type: "user/login",
        payload?: { account: string; password?: string },
        options?: DispatchOptions
    ): Promise<void>;
    (type: 'user/logout', option?: { root: true }): Promise<void>;

    (type: 'user/refresh', option?: { root: true }): Promise<void>;
    (type: 'user/refreshInfo', option?: { root: true }): Promise<void>;
    (type: 'user/refreshSkin', option?: { root: true }): Promise<void>;

    (type: 'user/uploadSkin', payload: { data: string, slim: boolean }): Promise<void>

    (type: 'version/refresh', option?: { root: true }): Promise<void>;
    (type: 'version/checkDependency', version: string, option?: { root: true }): Promise<void>;

    (type: 'version/minecraft/refresh'): Promise<void>;
    (type: 'version/minecraft/download', meta: VersionMeta): Promise<void>;

    (type: 'version/liteloader/refresh'): Promise<void>;
    (type: 'version/liteloader/download', meta: LiteLoader.VersionMeta): Promise<void>;

    (type: 'version/forge/refresh'): Promise<void>;
    (type: 'version/forge/download', meta: Forge.VersionMeta): Promise<void>;

    (type: 'java/add', location: string | string[]): Promise<void>;
    (type: 'java/remove', location: string | string[]): Promise<void>;
    (type: 'java/install'): Promise<void>;
    (type: 'java/refresh'): Promise<void>;
    (type: 'java/test', javaPath: string): Promise<void>;
    (type: 'java/download'): Promise<void>;

    (type: 'profile/createAndSelect', option: CreateOption): Promise<void>
    (type: 'profile/create', option: CreateOption): Promise<string>
    (type: 'profile/select', id: string): Promise<void>
    (type: 'profile/delete', id: string): Promise<void>
    (type: 'profile/resolveResources'): Promise<void>
    (type: 'profile/diagnose'): Promise<void>
    (type: 'profile/fix'): Promise<void>

    (type: 'profile/enableForge'): Promise<void>;
    (type: 'profile/addForgeMod'): Promise<void>;
    (type: 'profile/delForgeMod'): Promise<void>;

    (type: 'profile/enableLiteloader'): Promise<void>;
    (type: 'profile/addLiteloaderMod'): Promise<void>;
    (type: 'profile/delLiteloaderMod'): Promise<void>;

    (type: 'resource/remove', resource: string | ResourceModule.Resource, option?: { root: true }): Promise<void>;
    (type: 'resource/rename', option: { resource: string | ResourceModule.Resource<any>, name: string }, option?: { root: true }): Promise<void>;
    (type: 'resource/import', option: ResourceModule.ImportOption, option?: { root: true }): Promise<Resource<any>>;
    (type: 'resource/export', option: { resources: (string | ResourceModule.Resource<any>)[], targetDirectory: string }, option?: { root: true }): Promise<void>;
    (type: 'resource/link', option: { resources: (string | ResourceModule.Resource<any>)[], minecraft: string }, option?: { root: true }): Promise<void>;
}

interface RootGetter {
    ['profile/current']: ProfileModule.Profile
    ['path']: (...args: string) => string

    ['user/history']: string[]
    ['user/logined']: boolean
    ['user/offline']: boolean
    ['user/authModes']: string[]

    ['user/isServiceCompatible']: boolean
    ['user/authService']: string
    ['user/profileService']: string
}

interface Repo extends Store<RootState> {
    getters: RootGetter;
    commit: {
        (type: 'profile/edit', payload: any): void
        (type: 'profile/gamesettings', settings: GameSetting.Frame): void
    },
    dispatch: RootDispatch;
}

declare module "vue/types/vue" {
    interface Vue {
        $repo: Repo
        $electron: RendererInterface
    }
}

declare module "vuex" {
    interface FullModule<S, R, G, M, D> extends Module<S, R> {
        actions?: ActionTree<S, R> & {
            [key: string]: (this: Store<S>, injectee: { state: S, dispatch: D & RootDispatch; commit: M, rootGetters: RootGetter, getters: G, rootState: RootState }, payload: any) => any & Action<S, R>;
        };
    }
}

interface RootState {
    root: string,
    version: VersionModule.State,
    user: UserModule.State,
    profile: ProfileModule.State,
    java: JavaModule.State,
    resource: ResourceModule.State,
    task: TaskModule.State,
    config: ConfigModule.State,
}

import { Store } from "vuex";
import { Event } from "electron";

declare module "electron" {
    interface IpcMain {
        on(channel: 'minecraft-start', listener: () => void): this;
        on(channel: 'minecraft-exit', listener: () => void): this;
        on(channel: 'minecraft-stdout', listener: (out: string) => void): this;
        on(channel: 'minecraft-stderr', listener: (err: string) => void): this;

        on(channel: 'store-ready', listener: (store: Store<any>) => void): this;
        on(channel: 'reload', listener: () => void): this;

        on(channel: 'window-open', listener: (event: Event, windowId: string) => void);
        on(channel: 'window-close', listener: (event: Event) => void);
    }
}
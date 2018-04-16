import { net } from 'electron'
import { MojangService } from 'ts-minecraft'

export default {
    namespaced: true,
    actions: {
        fetchUserInfo(context, accessToken) {
            return MojangService.getAccountInfo(accessToken);
        },
        fetchNews() {
            return new Promise((resolve, reject) => {
                const req = net.request('https://launchermeta.mojang.com/mc/news.json');
                req.on('response', (response) => {
                    let str = ''
                    response.on('data', (buf) => { str += buf.toString() });
                    response.on('end', (buf) => { resolve(str) })
                })
                req.end()
            })
        },
        fetchLauncherInfo(context) {
            return new Promise((resolve, reject) => {
                const req = net.request('https://launchermeta.mojang.com/mc/launcher.json');
                req.on('response', (response) => {
                    let str = ''
                    response.on('data', (buf) => { str += buf.toString() });
                    response.on('end', (buf) => { resolve(str) })
                })
                req.end()
            })
        },
        uploadSkin(context, skin) {
            const token = context.state.auth.accessToken;
            const uuid = context.state.auth.selectedProfile.id;
            console.log(`uuid ${uuid}, token ${token}`);
            MojangService.setTexture({
                uuid,
                accessToken: token,
                type: 'skin',
                texture: {
                    metadata: {
                        model: 'steve',
                    },
                },
            });
        },
    },
}

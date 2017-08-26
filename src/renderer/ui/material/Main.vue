<template>
    <div id="main">
        <mu-appbar title="Main" :zDepth="0" class="Appbar moveAble" :class="{'nav-hide': !openNav}">
            <mu-icon-button v-if="atMain" @click="toggleNav" class="notMoveAble" icon="menu" slot="left" />
            <mu-icon-button class="notMoveAble" icon="clear" slot="right" />
        </mu-appbar>
        <div>
            <mu-float-button icon="add" class="demo-float-button"/>
        </div>
        <mu-drawer :open="openNav" :docked="docked" :overlay="docked" class="app-drawer" :zDepth="1">
            <mu-appbar :zDepth="0" title="ILauncher"></mu-appbar>
        </mu-drawer>
        <create v-if="inPage.createPackage" @closeTab="closeAllPage">
        </create>
        <floatButton @changePage="changePage"> </floatButton>
        <Login v-if="needLogin"></Login>
    </div>
</template>

<script>
import Vue from 'vue'
import Vuetify from 'vuetify'
import MuseUI from 'muse-ui';
Vue.use(Vuetify);
Vue.use(MuseUI);

require("muse-ui/dist/muse-ui.css")
require("muse-ui/dist/muse-ui.js")
import Login from './components/Login'
import floatButton from './components/Utils/FloatButton'
import Create from './components/Create'
import { mapMutations, mapState, mapActions, mapGetters } from 'vuex'

export default {
    
    data() {
        return {
            openNav: true,
            docked: true,
            needLogin: false,
            showFloatButton: true,
            inPage: {
                createPackage: false
            }
        }
    },
    computed: {
        atMain() {
            for (const item of Object.keys(this.inPage)) {
                if (this.inPage[item] == true) {
                    return false;
                }
            }
            return true;
        },
        selecting() {
            return this.selectProfileID != undefined && this.selectProfileID != '' && this.selectProfileID != null
        },
        ...mapGetters('profiles', {
            'selectedProfile': 'selected',
            'profiles': 'allStates',
            'keys': 'allKeys',
            'getByKey': 'getByKey',
            'selectProfileID': 'selectedKey'
        }),
        playerName() {
            return this.$store.state.auth.authInfo ? this.$store.state.auth.authInfo.selectedProfile.name : 'Steve';
        },
    },
    mounted(e) {
        console.log(this.playerName)
        if (this.playerName === 'Steve') {
            this.needLogin = true;
        }
    },
    methods: {
        toggleNav() {
            this.openNav = !this.openNav;
        },
        changePage(id) {
            this.closeAllPage()
            this.inPage[id] = true;
        },
        closeAllPage() {
            for (const item of Object.keys(this.inPage)) {
                this.inPage[item] = false;
            }
            this.openNav = false;
        }
    },
    components: { Login, Create, floatButton }
}
</script>

<style scoped>
    .moveAble {
        -webkit-app-region: drag;
    }

    .notMoveAble {
        -webkit-app-region: no-drag;
    }

    .Appbar {
        position: fixed;
        left: 256px;
        right: 0;
        top: 0;
        width: auto;
        -webkit-transition: all .45s cubic-bezier(.23, 1, .32, 1);
        transition: all .45s cubic-bezier(.23, 1, .32, 1)
    }

    .Appbar.nav-hide {
        left: 0;
    }
</style>

<style>
    body {
        font-family: Microsoft YaHei !important;
        
    }
    #floatButton > .mu-float-button-mini {
        bottom: 8px;
    }
    .childFlatButtonGroup button {
        position: fixed;
        right: 40px;
        bottom: 32px;
    }
</style>
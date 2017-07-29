<template>
    <div id="main">
        <mu-appbar title="Main" :zDepth="0" class="Appbar moveAble" :class="{'nav-hide': !openNav}">
            <mu-icon-button @click="toggleNav" class="notMoveAble" icon="menu" slot="left" />
            <mu-icon-button class="notMoveAble" icon="clear" slot="right" />
        </mu-appbar>
        <div>
            <mu-float-button icon="add" class="demo-float-button"/>
        </div>
        <mu-drawer :open="openNav" :docked="docked" :overlay="docked" class="app-drawer" :zDepth="1">
            <mu-appbar :zDepth="0" title="ILauncher">
                
            </mu-appbar>
        </mu-drawer>
        
        <div id="floatButton" v-if="showFloatButton">
        
            <transition name="fade">
                <div class="childFlatButtonGroup" :class="{'hidden': !activeFloat}">
                    <mu-float-button class="childFlatButton" icon="add" mini />
                    <mu-float-button class="childFlatButton" icon="add" mini />
                </div>
            </transition>        
            <mu-float-button class="actionButton" @click="toggleButton" icon="add"/>
        </div>
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
import { mapMutations, mapState, mapActions, mapGetters } from 'vuex'

export default {
    
    data() {
        return {
            openNav: true,
            docked: true,
            needLogin: false,
            showFloatButton: true,
            activeFloat: false
        }
    },
    computed: {
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
        toggleButton() {
            this.activeFloat = !this.activeFloat;
        }
    },
    components: { Login }
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

    #floatButton {
        position: fixed;
        bottom: 18px;
        right: 32px;
        text-align: right;
        z-index: 2;
    }

    .childFlatButtonGroup button:nth-child(1) {
        position: fixed;
        right: 40px;
        bottom: 100px;
    }
    .childFlatButtonGroup button:nth-child(2) {
        position: fixed;
        right: 40px;
        bottom: 160px;
    }
    .childFlatButtonGroup.hidden button {
        z-index: 1;
        right: 40px;
        bottom: 30px;
    }

    .actionButton {
        -webkit-transition: all .3s;
        transition: all .3s;
        z-index: 2;
    }

    .fade-enter-active, .fade-leave-active {
          transition: bottom .5s
    }
    .fade-enter, .fade-leave-to /* .fade-leave-active in below version 2.1.8 */ {
        opacity: 0
    }
</style>

<style>
    html {
        font-family: Microsoft YaHei;
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

<style lang="stylus">
    @import '../../assets/main'
</style>

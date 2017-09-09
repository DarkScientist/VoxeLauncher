<template>
    <mu-card>
        <mu-card-header class="cardHeader" title="CaddyServer" subTitle="A minecraft server">
            <!-- <div id="wapper"></div> -->
            <mu-icon-button icon="edit"/>
        </mu-card-header>
        <mu-card-text class="card-text underline">
            <p>Ping: 1ms</p>
            <p>User: 1/20</p>
            <p>Players: 
                <mu-chip class="player-chip">
                    Indexyz
                </mu-chip>
            </p>
        </mu-card-text>
        <mu-card-actions class="card-actions">
            <div id="wapper"></div>
            <mu-icon-button icon="delete" class="card-actions-right"/>
            <mu-icon-button icon="play_arrow" class="card-actions-right"/>
        </mu-card-actions>
    </mu-card>
</template>

<script>
    export default {
        data() {
            return {

            }
        },
        methods: {

        }
    }
</script>

<style>
    .cardHeader > .mu-card-header-title {
        width: 100%
    }
</style>


<style scoped>
    .card-text {
        line-height: 0.8;
        font-size: 13px;
        color: rgba(0,0,0,.54);
        padding-top: 8px;
    }
    .card-text > p {
        margin-bottom: 0px;
    }
    .cardHeader {
        width: 100%;
        display: flex;
        flex-wrap: wrap/wrap-reverse;
        align-items: center;
    }
    .card-actions {
        padding-top: 0px;
        width: 100%;
        display: flex;
        flex-wrap: wrap/wrap-reverse;
        align-items: center;
        padding-bottom: 0px;
    }
    #wapper {
        width: 100%
    }
    .card-actions > .card-actions-right {
        justify-content: right;
        align-items: right;
        text-align: right;
        /* padding-right: 8px */
    }
    .cardHeader {
        padding-bottom: 8px;
    }
    .player-chip {
        line-height: 24px;
    }
    .underline {
        border-bottom: 1px #e1e4e8 solid;
    }
</style>

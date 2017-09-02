<template>
    <div id="joinServer">
        <mu-paper class="section" :zDepth="1">
            <div class="sectionLeft">
                <p>连入服务器</p>
            </div>
            <div class="sectionRight">
                <mu-flat-button label="取消创建" backgroundColor="#FFF" @click="closeTab"/>
            </div>
        </mu-paper>
        <div class="container">
            <mu-stepper orientation="vertical" :activeStep="activeStep">
                <mu-step>
                    <mu-step-label>
                        输入服务器信息
                    </mu-step-label>
                    <mu-step-content>
                        <mu-text-field hintText="服务器名称" :errorText="error.Name" v-model="name"/><br/>
                        <mu-text-field hintText="服务器IP或域名" :errorText="error.IP" v-model="ip"/><br/>
                        <mu-text-field 
                            hintText="服务器端口" 
                            :errorText="error.Port" 
                            :defalut="port" 
                            type="number" 
                            v-model="port"
                            max="65566"
                            min="0"
                        /><br/>
                        <mu-raised-button label="完成" @click="handleNext" primary/>
                    </mu-step-content>
                </mu-step>
            </mu-stepper>
        </div>
    </div>
</template>

<script>
    import { mapMutations, mapState, mapActions, mapGetters } from 'vuex'
    export default {
        data() {
            return {
                ip: "",
                name: "",
                port: 25565,
                activeStep: 0,
                error: {
                    Name: "",
                    IP: "",
                    Port: ""
                }
            }
        },
        methods: {
            ...mapActions('profiles', {
                createProfile: 'createAndSelect',
                selectProfile: 'select',
                deleteProfile: 'delete',
            }),
            closeTab() {
                this.$emit("closeTab")
            },
            handleNext() {
                const valuesList = ["Name", "IP", "Port"]
                let flag = true;
                for (const item of valuesList){
                    if (this[item.toLowerCase()] === "") {
                        this.error[item] = "Need input " + item
                        flag = false;
                    }
                }
                if (this.port > 65565 || this.port < 0) {
                    this.error.port = "Port Number is error"
                    flag = false;
                }
                if (flag === true) {
                    this.createProfile({
                        type: "server",
                        option: {
                            name: this.name, 
                            host: this.ip, 
                            port: this.port, 
                            isEdit: false
                        }
                    })
                    this.closeTab()
                }
            }
        }
    }
</script>

<style>
    .section {
        background-color: #37474f;
        min-height: 48px;
        width: 100%;
        display: flex;
        flex-wrap: wrap/wrap-reverse;
        align-items: center;
    }
    .section > .sectionLeft {
        width: 100%;
        padding-left: 12px;
    }
    .section > .sectionRight {
        width: 100%;
        justify-content: right;
        align-items: right;
        text-align: right;
        padding-top: 2px;
        padding-right: 8px;
    }
    .section > * > p {
        color: #FFF;
        font-family: Microsoft YaHei;
    }
    .contentCenter {
        clear: both;
        height: 240px;
        position: relative;
    }
    .container {
        padding-left: 8vw;
        padding-top: 4vh;
        padding-right: 8vw;
    }
</style>

<style scoped>

</style>

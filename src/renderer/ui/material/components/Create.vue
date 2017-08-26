<template>
    <div>
        <mu-paper class="section" :zDepth="1">
            <div class="sectionLeft">
                <p>创建整合包</p>
            </div>
            <div class="sectionRight">
                <mu-flat-button label="取消创建" backgroundColor="#FFF" @click="closeTab"/>
            </div>
        </mu-paper>
        <div class="container">
            <mu-stepper orientation="vertical" :activeStep="activeStep">
                <mu-step>
                    <mu-step-label>
                        选择一个版本
                    </mu-step-label>
                    <mu-step-content>
                        <p>
                            从官方源选择一个版本来进行下一步
                        </p>
                        <Version :selectVersion.sync="version" :error="error.versionErrorText"></Version>
                        <mu-raised-button label="下一步" @click="handleNext" primary/>
                    </mu-step-content>
                </mu-step>
                <mu-step>
                    <mu-step-label>
                        设置整合包基本属性
                    </mu-step-label>
                    <mu-step-content>
                        <mu-text-field hintText="整合包名字" :errorText="error.noInputName" v-model="name"/><br/>
                        <mu-text-field hintText="整合包版本" :errorText="error.noInputVersion" v-model="packageverison"/><br/>
                        <mu-text-field hintText="整合包作者" :errorText="error.noInputAuthor" v-model="author"/><br/>
                        <mu-raised-button label="下一步" @click="handleNext" primary/>
                        <mu-flat-button label="上一步" @click="handlePrev"/>
                    </mu-step-content>
                </mu-step>
                <mu-step>
                    <mu-step-label>
                        选择Mod/材质包
                    </mu-step-label>
                    <mu-step-content>
                        <mu-raised-button label="下一步" @click="handleNext" primary/>
                        <mu-flat-button label="上一步" @click="handlePrev"/>
                    </mu-step-content>
                
                </mu-step>
                <mu-step>
                    <mu-step-label>
                        创建结束
                    </mu-step-label>
                    <mu-step-content>
                        <mu-raised-button label="完成" @click="handleNext" primary/>
                    </mu-step-content>
                </mu-step>
            </mu-stepper>
        </div>
    </div>
</template>

<script>
    import { mapMutations, mapState, mapActions, mapGetters } from 'vuex'
    import Version from './Select/Version'
    export default {
        data() {
            return {
                version: "",
                activeStep: 0,
                error: {
                    versionErrorText: "",
                    noInputName: "",
                    noInputPackageVersion: "",
                    noInputAuthor: ""
                },
                name: "",
                author: this.username,
                packageverison: "0.0.0"
            }
        },
        computed: {
            ...mapGetters('auth', ['username'])
        },
        methods: {
            handleNext() {
                if (this.activeStep === 0) {
                    if (this.version === "") {
                        this.error.versionErrorText = "Version not select"
                    } else {
                        this.error.versionErrorText = ""
                        this.activeStep++;
                    }
                } else if (this.activeStep === 1) {
                    const needToCheck = ["Name", "PackageVersion", "Author"];
                    let gotoNext = true;
                    for (const item of needToCheck) {
                        if (this[item.toLowerCase()] === "") {
                            this.error["noInput" + item] = "Need to input " + item
                            gotoNext = false;
                        }
                    }

                    if (gotoNext) {
                        this.activeStep++;
                        for (const item of needToCheck) {
                            this.error["noInput" + item] = ""
                        }
                    } 
                } else if (this.activeStep === 2) {
                    this.activeStep++
                } else {
                    // Finish The package
                }
            },
            handlePrev() {
                this.activeStep--;
            },
            closeTab() {
                this.$emit("closeTab")
            }
        },
        components: {
            Version
        },
        mounted(e) {
            this.author = this.username
        }
    }    
</script>

<style scoped>
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
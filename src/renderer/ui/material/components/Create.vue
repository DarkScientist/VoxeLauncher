<template>
    <div>
        <mu-paper class="section" :zDepth="1">
            <div class="sectionLeft">
                <p>创建整合包</p>
            </div>
            <div class="sectionRight">
                <mu-flat-button label="取消创建" backgroundColor="#FFF"/>
            </div>
        </mu-paper>
        <div class="container">
            <mu-stepper :activeStep="activeStep" orientation="vertical">
                <mu-step>
                    <mu-step-label>
                        选择一个版本
                    </mu-step-label>
                    <mu-step-content>
                        <p>
                            从官方源选择一个版本来进行下一步
                        </p>
                        <mu-raised-button label="下一步" @click="handleNext" primary/>
                    </mu-step-content>
                </mu-step>
                <mu-step>
                    <mu-step-label>
                        设置整合包基本属性
                    </mu-step-label>
                    <mu-step-content>
                        <mu-raised-button label="下一步" @click="handleNext" primary/>
                        <mu-flat-button label="上一步" @click="handlePrev"/>
                    </mu-step-content>
                </mu-step>
                <mu-step>
                    <mu-step-label>
                        选择Mod/材质包
                    </mu-step-label>
                    <mu-step-content>
                        <mu-raised-button label="完成" @click="handleNext" primary/>
                        <mu-flat-button label="上一步" @click="handlePrev"/>
                    </mu-step-content>
                
                </mu-step>
                <mu-step>
                    <mu-step-label>
                        创建结束
                    </mu-step-label>
                    <mu-step-content>
                        <mu-raised-button label="下一步" @click="handleNext" primary/>
                    </mu-step-content>
                </mu-step>
            </mu-stepper>
        </div>
    </div>
</template>

<script>
    export default {
        
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
    
</style>
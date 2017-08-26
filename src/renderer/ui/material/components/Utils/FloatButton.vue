<template>
    <div id="floatButton">
            <transition name="fade">
                <div class="childFlatButtonGroup" :class="{'hidden': !activeFloat}">
                    <mu-float-button @click="toggleCreatePage" ref="createPackageButton" class="childFlatButton" icon="create_new_folder" mini />
                    <mu-float-button class="childFlatButton" icon="explore" mini />
                </div> 
            </transition>                           
            <transition name="routeIcon">   
                <mu-float-button class="actionButton" @click="toggleButton" icon="add" :class="{'active': activeFloat}"/>
            </transition>   
        </div>
</template>

<script>
    export default {
        data() {
            return {
                activeFloat: false,
            }
        },
        methods: {
            toggleCreatePage() {
                this.$emit("changePage", "createPackage")
            },
            toggleButton() {
                this.activeFloat = !this.activeFloat;
            },
        }
    }
</script>


<style scoped>
    #floatButton {
        position: fixed;
        bottom: 18px;
        right: 32px;
        text-align: right;
        z-index: 3;
    }

    .childFlatButtonGroup button:nth-child(1) {
        position: fixed;
        right: 40px;
        bottom: 100px;
        z-index: 2;
    }
    .childFlatButtonGroup button:nth-child(2) {
        position: fixed;
        right: 40px;
        bottom: 160px;
        z-index: 1;
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
    .fade-enter, .fade-leave-to {
        opacity: 0
    }
    .active {
        transition: all .3s;
        transform: rotate(-45deg);
        background-color: red;
    }
</style>


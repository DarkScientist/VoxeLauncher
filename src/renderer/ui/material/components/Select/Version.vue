<template>
    <div>
        <mu-select-field :maxHeight="300" label="选择你喜欢的游戏" v-bind:value="selectVersion" v-on:change="update($event)" :errorText="error">
            <mu-menu-item v-for="{id}, index in metas" :key="id" :value="id" :title="id"/>
        </mu-select-field>
    </div>
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'
export default {
    // props: ["error", "selectVersion"],
    props: {
        error: "",
        selectVersion: String
    },
    data() {
        return {
            version: ""
        }
    },
    mounted() {
        this.$store.dispatch("versions/refresh")
    },
    computed: {
        ...mapState('versions', ['minecraft', 'refresh']),
        metas() {
            return this.minecraft.versions
        }
    },
    methods: {
        update(data){
            this.$emit("update:selectVersion", data)
        }
        // ...mapActions('versions', ['refresh'])
    }
    // },
    // watch: {
    //     selectVersion(val) {
    //         this.$emit("on-version-change", val)
    //     }
    // }
}
</script>
<template>
	<v-container grid-list-xs fill-height style="overflow: auto;">
		<v-layout row wrap>
			<v-flex tag="h1" style="margin-bottom: 10px; padding: 6px; 8px;" class="white--text" xs12>
				<span class="headline">{{$tc('mod.name', 2)}}</span>
			</v-flex>
			<v-flex d-flex xs12>
				<forge-version-menu>
					<template v-slot="{ on }">
						<v-text-field hide-details :loading="refreshing" dark append-icon="arrow" v-model="forgeVersion"
						  :label="$t('forge.version')" :readonly="true" @click:append="on.keydown" v-on="on" @value="forgeVersion = $event"></v-text-field>
					</template>
				</forge-version-menu>
				<v-switch dark :label="$t('forge.enabled')"></v-switch>
			</v-flex>
			<v-flex d-flex xs6>
				<v-card dark class="pack-list" @drop="onDropLeft" @dragover="onDragOver">
					<p class="text-xs-center headline" style="position: absolute; top: 120px; right: 0px; user-select: none;"
					  v-if="mods[1].length === 0">
						<v-icon style="font-size: 50px; display: block;">save_alt</v-icon>
						{{$t('mod.hint')}}
					</p>
					<mod-card v-for="(pack, index) in mods[1]" :key="pack.hash" :data="pack.metadata[0]"
					  :isSelected="false" :index="index" :hash="pack.hash">
					</mod-card>
				</v-card>
			</v-flex>
			<v-flex d-flex xs6>
				<v-card dark class="pack-list" @drop="onDropRight" @dragover="onDragOver">
					<p class="text-xs-center headline" style="position: absolute; top: 120px; right: 0px; user-select: none;"
					  v-if="mods[0].length === 0">
						<v-icon style="font-size: 50px; display: block;">save_alt</v-icon>
						{{$t('mod.hint')}}
					</p>
					<mod-card v-for="(pack, index) in mods[0]" :key="pack.hash" :data="pack.metadata[0]"
					  :isSelected="true" :index="index" :hash="pack.hash">
					</mod-card>
				</v-card>
			</v-flex>
		</v-layout>
	</v-container>
</template>

<script>
import Vue from 'vue';
import ModCard from './ModCard';
import unknownPack from 'static/unknown_pack.png';
import ForgeVersionMenu from '../ForgeVersionMenu';

export default {
  data() {
    return {
      forgeVersion: '',
      refreshing: false,
    }
  },
  computed: {
    profile() { return this.$repo.getters['profile/current']; },
    forge() { return this.profile.forge; },
    mcversion() { return this.profile.mcversion; },
    mods() {
      const mods = this.$repo.getters['resource/mods'];
      const selectedModsIds = this.forge.mods || [];

      const selected = {};
      for (const id of selectedModsIds) {
        selected[id] = true;
      }

      const unselectedMods = [];
      const idToMod = {};
      for (const mod of mods) {
        const modMeta = mod.metadata[0];
        idToMod[modMeta.modid + ':' + modMeta.version] = mod;
        if (!selected[modMeta.modid + ':' + modMeta.version])
          unselectedMods.push(mod);
      }

      const selectedMods = selectedModsIds.map(id => idToMod[id] || { id, missing: true, metadata: [{ name: 'missing' }] });

      return [selectedMods, unselectedMods];
    },

  },
  mounted() {
    this.refreshing = true;
    this.$repo.dispatch('version/forge/refresh').finally(() => {
      this.refreshing = false;
    });
    this.forgeVersion = this.forge.version;
  },
  methods: {
    changePosition(index, toIndex) {
      if (index === toIndex) return;
      const mods = [...this.forge.mods || []];

      const deleted = mods.splice(index, 1);
      mods.splice(toIndex, 0, ...deleted);

      this.$repo.commit('profile/forge', {
        mods,
      });
    },
    select(index) {
      const [selected, unselected] = this.mods;

      const newJoin = unselected[index];
      const mods = [...this.forge.mods || []];
      mods.unshift(newJoin.metadata[0].modid + ':' + newJoin.metadata[0].version);
      this.$repo.commit('profile/forge', {
        mods,
      });
    },
    unselect(index) {
      const mods = [...this.forge.mods || []];
      Vue.delete(mods, index);
      this.$repo.commit('profile/forge', {
        mods,
      });
    },

    onDragOver(event) {
      event.preventDefault();
      return false;
    },
    onDropLeft(event) {
      return this.handleDrop(event, true);
    },
    onDropRight(event) {
      return this.handleDrop(event, false);
    },
    handleDrop(event, left) {
      event.preventDefault();
      const length = event.dataTransfer.files.length;
      if (length > 0) {
        console.log(`Detect drop import ${length} file(s).`);
        for (let i = 0; i < length; ++i) {
          this.$repo.dispatch('resource/import', event.dataTransfer.files[i])
            .catch((e) => {
              console.error(e);
            });
        }
      }
      const indexText = event.dataTransfer.getData('Index');
      if (indexText) {
        const index = Number.parseInt(indexText.substring(1), 10);
        const y = event.clientY;
        if (indexText[0] === 'L') {
          if (left) {
            // do nothing now...
          } else {
            this.select(index);
          }
        } else {
          if (left) {
            this.unselect(index);
          } else {
            const all = document.getElementsByClassName('mod-card');
            for (let i = 0; i < all.length; ++i) {
              const rect = all.item(i).getBoundingClientRect();
              if (y < rect.y + rect.height) {
                this.changePosition(index, i);
                break;
              }
              if (i === all.length - 1) {
                this.changePosition(index, all.length);
              }
            }
          }
        }
      }
    },
  },
  components: { ModCard, ForgeVersionMenu }
}
</script>
<style scoped=true>
.pack-list {
  padding: 10px;
  margin: 6px 0px;
  min-height: 400px;
  max-height: 400px;

  max-width: 95%;
  min-width: 95%;
  overflow: auto;
}
</style>

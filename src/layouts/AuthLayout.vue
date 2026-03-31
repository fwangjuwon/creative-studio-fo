<template>
  <v-app>
    <v-main class="auth-main">
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="5" lg="4">
            <router-view />
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer app color="transparent" height="36">
      <v-spacer />
      <span class="text-caption" style="color: rgba(255,255,255,0.7);">Turn your words into art. Developed by IT개발팀.</span>
      <v-spacer />
    </v-footer>
  </v-app>
</template>

<style scoped>
.auth-main {
  background: linear-gradient(135deg, #FDE8E7 0%, #F0C3C1 50%, #D4A0A2 100%);
}
</style>

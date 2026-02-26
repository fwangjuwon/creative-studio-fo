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
  </v-app>
</template>

<style scoped>
.auth-main {
  background: linear-gradient(135deg, #1976D2 0%, #42A5F5 100%);
}
</style>

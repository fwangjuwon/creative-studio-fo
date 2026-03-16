import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#F0C3C1',
          'on-primary': '#5A2D2D',
          secondary: '#9D6D6F',
          'on-secondary': '#ffffff',
          accent: '#FFF0EF',
          error: '#C62828',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
        },
      },
      dark: {
        colors: {
          primary: '#E8A09D',
          'on-primary': '#3B1A1A',
          secondary: '#B08082',
          'on-secondary': '#ffffff',
          accent: '#FBE4E3',
          error: '#C62828',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})

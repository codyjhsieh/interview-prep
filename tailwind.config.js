module.exports = {
  content: ["./index.html", "./js/**/*.js"],
  theme: {
    extend: {
      screens: { lg: '900px' },
      colors: {
        ink:    { 950:'#F1F3F8', 900:'#F4F5F9', 800:'#F7F8FB', 700:'#FFFFFF', 600:'rgba(15,23,42,0.10)' },
        accent: { 400:'#0EA371', 500:'#0B8A60', 600:'#0A7553' },
        warm:   { 400:'#C7780E', 500:'#A86409' },
        rose:   { 400:'#D7384C', 500:'#B22B3D' },
        violet: { 400:'#7849E0', 500:'#6336C7' },
        sky:    { 400:'#2E6FE0', 500:'#1F5BC1' },
      },
    },
  },
  corePlugins: { preflight: true },
};
